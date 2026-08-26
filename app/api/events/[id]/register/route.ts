import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createRegistration, DUPLICATE_REGISTRATION_ERROR } from "@/lib/data/registrations";
import { getEventById } from "@/lib/data/events";
import { deriveEventStatus } from "@/lib/event-status";

const PHONE_REGEX = /^(\+62|0)8[0-9]{7,12}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TEXT_LENGTH = 150;
const MAX_MESSAGE_LENGTH = 1000;

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

  return null;
}

function generateRegistrationNumber() {
  // Generated server-side, never trusting a client-supplied value — this
  // identifier ends up in the admin's CSV export, so it shouldn't be
  // attacker-controlled input either.
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `MC-${random}`;
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
  const { name, phone, email, origin, dateOfBirth, message } = body as {
    name: string;
    phone: string;
    email: string;
    origin: string;
    dateOfBirth: string;
    message?: string | null;
  };

  // Check the registration window/capacity explicitly before attempting the
  // insert, so a normal "this event isn't open" case gets a clean "closed"
  // response instead of relying on parsing a raw Postgres error. A
  // malformed `id` (invalid UUID) makes getEventById reject rather than
  // throw, so it falls through to the same 403 instead of crashing to a 500.
  const event = await getEventById(supabase, id).catch(() => null);
  if (!event || !event.published || deriveEventStatus(event) !== "open") {
    return NextResponse.json({ error: "closed" }, { status: 403 });
  }

  try {
    const registration = await createRegistration(supabase, {
      registrationNumber: generateRegistrationNumber(),
      eventId: id,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      origin: origin.trim(),
      dateOfBirth,
      message: message?.trim() || null,
    });

    return NextResponse.json({ registrationNumber: registration.registrationNumber });
  } catch (error) {
    if (error instanceof Error && error.message === DUPLICATE_REGISTRATION_ERROR) {
      return NextResponse.json({ error: "duplicate" }, { status: 409 });
    }
    return NextResponse.json({ error: "closed" }, { status: 403 });
  }
}
