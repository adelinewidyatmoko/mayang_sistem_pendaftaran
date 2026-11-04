import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  CAPACITY_EXCEEDED_ERROR,
  createRegistration,
  DUPLICATE_REGISTRATION_ERROR,
  REGISTRATION_CLOSED_ERROR,
} from "@/lib/data/registrations";
import { getEventById } from "@/lib/data/events";
import {
  deriveEventStatus,
  isUnlimitedCapacity,
  MAX_TICKETS_PER_REGISTRATION,
} from "@/lib/event-status";

const PHONE_REGEX = /^(\+62|0)8[0-9]{7,12}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TEXT_LENGTH = 150;
const MAX_MESSAGE_LENGTH = 1000;
const MIN_COMPANION_NAME_LENGTH = 2;

// A human can't read and fill 5 fields faster than this — catches scripts
// that POST directly without ever rendering the page. Generous on purpose:
// this only needs to catch generic spam bots, not a targeted attacker who's
// read this file, and it must never false-positive on a real registrant.
const MIN_SUBMIT_MS = 1200;

// Cheap, no-infrastructure bot filtering: a honeypot field (see `website`
// below — RegistrationForm.tsx renders it hidden off-screen; a real user
// never fills it in, but generic form-spam bots blindly fill every field
// they find in the DOM) plus the timing check above. Deliberately not a
// DB- or Redis-backed rate limiter — this endpoint has no real per-user
// state to rate-limit against (no login), and the actual risk here is
// generic bots grief-filling an event's limited quota, which this catches
// without an extra Supabase round-trip on every request.
function isLikelyBot(body: Record<string, unknown>): boolean {
  if (typeof body.website === "string" && body.website.trim() !== "") return true;

  if (typeof body.formRenderedAt === "number") {
    if (Date.now() - body.formRenderedAt < MIN_SUBMIT_MS) return true;
  }

  return false;
}

// Mirrors the client-side checks in RegistrationForm.tsx — required per
// PRD §8: "Validasi wajib dilakukan di client-side DAN server-side (jangan
// hanya andalkan validasi di frontend)". A request that bypasses the form
// entirely (calling this API directly) must still be rejected the same way.
function validateRegistrationBody(body: unknown) {
  if (!body || typeof body !== "object") return "Data pendaftaran tidak lengkap.";
  const b = body as Record<string, unknown>;

  if (typeof b.name !== "string" || b.name.trim().length < 3 || b.name.length > MAX_TEXT_LENGTH) {
    return "Nama lengkap tidak valid.";
  }
  if (typeof b.phone !== "string" || !PHONE_REGEX.test(b.phone.trim())) {
    return "Nomor telepon tidak valid.";
  }
  if (typeof b.email !== "string" || !EMAIL_REGEX.test(b.email.trim()) || b.email.length > MAX_TEXT_LENGTH) {
    return "Alamat email tidak valid.";
  }
  if (typeof b.origin !== "string" || !b.origin.trim() || b.origin.length > MAX_TEXT_LENGTH) {
    return "Asal / domisili tidak valid.";
  }
  if (typeof b.dateOfBirth !== "string" || !b.dateOfBirth) {
    return "Tanggal lahir tidak valid.";
  }
  const dob = new Date(b.dateOfBirth);
  if (Number.isNaN(dob.getTime()) || dob > new Date()) {
    return "Tanggal lahir tidak valid.";
  }
  if (b.message !== undefined && b.message !== null) {
    if (typeof b.message !== "string" || b.message.length > MAX_MESSAGE_LENGTH) {
      return "Pesan terlalu panjang.";
    }
  }

  // Pendamping opsional (tidak dikirim = pesan 1 kuota). Kalau ada, tiap
  // nama wajib diisi — panitia perlu tahu siapa yang datang.
  if (b.companions !== undefined) {
    if (!Array.isArray(b.companions)) {
      return "Data peserta lain tidak valid.";
    }
    if (b.companions.length > MAX_TICKETS_PER_REGISTRATION - 1) {
      return `Maksimal ${MAX_TICKETS_PER_REGISTRATION} peserta per pendaftaran.`;
    }
    for (let i = 0; i < b.companions.length; i++) {
      const c = b.companions[i];
      if (
        typeof c !== "string" ||
        c.trim().length < MIN_COMPANION_NAME_LENGTH ||
        c.length > MAX_TEXT_LENGTH
      ) {
        return `Nama peserta ${i + 2} tidak valid.`;
      }
    }
  }

  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const body = await request.json().catch(() => null);

  if (body && typeof body === "object" && isLikelyBot(body as Record<string, unknown>)) {
    // Blend in with a normal validation failure — no need to tell a bot
    // exactly which check caught it.
    return NextResponse.json(
      { error: "invalid", message: "Data pendaftaran tidak lengkap atau tidak valid." },
      { status: 400 }
    );
  }

  const validationError = validateRegistrationBody(body);
  if (validationError) {
    return NextResponse.json({ error: "invalid", message: validationError }, { status: 400 });
  }
  const { name, phone, email, origin, dateOfBirth, message, companions } = body as {
    name: string;
    phone: string;
    email: string;
    origin: string;
    dateOfBirth: string;
    message?: string | null;
    companions?: string[];
  };
  const companionNames = (companions ?? []).map((c) => c.trim());
  const ticketCount = 1 + companionNames.length;

  // Check the registration window/capacity explicitly before attempting the
  // insert, so a normal "this event isn't open" case gets a clean "closed"
  // response instead of relying on parsing a raw Postgres error. A
  // malformed `id` (invalid UUID) makes getEventById reject rather than
  // throw, so it falls through to the same 403 instead of crashing to a 500.
  const event = await getEventById(supabase, id).catch(() => null);
  if (!event || !event.published || deriveEventStatus(event) !== "open") {
    return NextResponse.json({ error: "closed" }, { status: 403 });
  }

  // Cek awal biar pesannya bisa menyebut sisa slot. Cek final yang pasti
  // benar tetap di DB (dengan lock), lihat CAPACITY_EXCEEDED di bawah.
  const remaining = isUnlimitedCapacity(event.maxParticipants)
    ? null
    : Math.max(event.maxParticipants - event.registeredCount, 0);
  if (remaining !== null && ticketCount > remaining) {
    return NextResponse.json({ error: "capacity", remaining }, { status: 409 });
  }

  try {
    const registration = await createRegistration(supabase, {
      eventId: id,
      name: name.trim(),
      phone: phone.trim(),
      // Huruf kecil: unique (event_id, email) di DB membedakan huruf besar,
      // jadi tanpa ini "A@x.com" dan "a@x.com" lolos sebagai dua pesanan.
      email: email.trim().toLowerCase(),
      origin: origin.trim(),
      dateOfBirth,
      message: message?.trim() || null,
      companions: companionNames,
    });

    return NextResponse.json({
      registrationNumber: registration.registrationNumber,
      ticketCount,
    });
  } catch (error) {
    if (error instanceof Error && error.message === DUPLICATE_REGISTRATION_ERROR) {
      return NextResponse.json({ error: "duplicate" }, { status: 409 });
    }
    if (error instanceof Error && error.message === CAPACITY_EXCEEDED_ERROR) {
      // Slot keburu diambil pendaftar lain di antara cek di atas dan insert.
      return NextResponse.json({ error: "capacity", remaining: null }, { status: 409 });
    }
    if (error instanceof Error && error.message === REGISTRATION_CLOSED_ERROR) {
      return NextResponse.json({ error: "closed" }, { status: 403 });
    }
    // Gangguan sistem (DB down, migrasi belum dijalankan, dll) — jangan
    // disamarkan jadi "pendaftaran ditutup".
    console.error("register_for_event_tickets failed", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
