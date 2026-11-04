import { SupabaseClient } from "@supabase/supabase-js";

import { Database } from "@/lib/supabase/types";

type RegistrationRow = Database["public"]["Tables"]["registrations"]["Row"];

export type Registration = {
  id: string;
  registrationNumber: string;
  eventId: string;
  name: string;
  phone: string;
  email: string;
  origin: string;
  dateOfBirth: string;
  message: string | null;
  fileUrl: string | null;
  fileName: string | null;
  // Jumlah kuota yang dipesan (1 + jumlah pendamping).
  ticketCount: number;
  // Nama orang yang ikut bersama pendaftar (kuota ke-2 dst).
  companions: string[];
  createdAt: string;
};

function mapRegistration(row: RegistrationRow): Registration {
  return {
    id: row.id,
    registrationNumber: row.registration_number,
    eventId: row.event_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    origin: row.origin,
    dateOfBirth: row.date_of_birth,
    message: row.message,
    fileUrl: row.file_url,
    fileName: row.file_name,
    // `??` jaga-jaga kalau kolom belum ada (migrasi 0014 belum dijalankan).
    ticketCount: row.ticket_count ?? 1,
    companions: row.companions ?? [],
    createdAt: row.created_at,
  };
}

export type CreateRegistrationInput = {
  eventId: string;
  name: string;
  phone: string;
  email: string;
  origin: string;
  dateOfBirth: string;
  message?: string | null;
  // Nama orang yang ikut (0-4). Total kuota = 1 + companions.length.
  companions: string[];
};

// Postgres unique_violation on (event_id, email) — PRD §24 duplicate check.
export const DUPLICATE_REGISTRATION_ERROR = "DUPLICATE_REGISTRATION";

// Event masih buka, tapi sisa slot kurang dari jumlah kuota yang dipesan.
export const CAPACITY_EXCEEDED_ERROR = "CAPACITY_EXCEEDED";
export const REGISTRATION_CLOSED_ERROR = "REGISTRATION_CLOSED";

function generateRegistrationNumber() {
  // Generated server-side, never trusting a client-supplied value — this
  // identifier ends up in the admin's CSV export, so it shouldn't be
  // attacker-controlled input either.
  const random = Math.random().toString(36).slice(2, 7).toUpperCase().padEnd(5, "0");
  return `MC-${random}`;
}

// Goes through the register_for_event_tickets() RPC (see
// supabase/migrations/0014_ticket_quantity.sql). Fungsi itu mengunci baris
// event (`for update`) lalu cek sisa kuota untuk 1 + jumlah pendamping, jadi
// rebutan slot terakhir antre, bukan sama-sama lolos. Insert lewat RPC ini
// satu-satunya jalur yang diizinkan RLS (lihat 0011).
export async function createRegistration(
  client: SupabaseClient<Database>,
  input: CreateRegistrationInput
): Promise<{ registrationNumber: string }> {
  // Nomor registrasi acak bisa (sangat jarang) bentrok dengan yang sudah
  // ada — itu bukan salah pendaftar, jadi ulangi dengan nomor baru.
  for (let attempt = 0; attempt < 3; attempt++) {
    const registrationNumber = generateRegistrationNumber();
    const { error } = await client.rpc("register_for_event_tickets", {
      p_event_id: input.eventId,
      p_registration_number: registrationNumber,
      p_name: input.name,
      p_phone: input.phone,
      p_email: input.email,
      p_origin: input.origin,
      p_date_of_birth: input.dateOfBirth,
      p_message: input.message ?? null,
      p_companions: input.companions,
    });

    if (!error) return { registrationNumber };

    if (error.code === "23505") {
      if (error.message.includes("registration_number")) continue;
      throw new Error(DUPLICATE_REGISTRATION_ERROR);
    }
    if (error.message === CAPACITY_EXCEEDED_ERROR) throw new Error(CAPACITY_EXCEEDED_ERROR);
    if (error.message === REGISTRATION_CLOSED_ERROR) throw new Error(REGISTRATION_CLOSED_ERROR);
    throw error;
  }

  throw new Error("Gagal membuat nomor registrasi unik.");
}

// Admin-only — RLS restricts reads to authenticated users.
export async function getRegistrationsForAdmin(
  client: SupabaseClient<Database>
): Promise<Registration[]> {
  const { data, error } = await client
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapRegistration);
}

export type UpdateRegistrationInput = {
  name: string;
  phone: string;
  email: string;
  origin: string;
  dateOfBirth: string;
  message?: string | null;
  // Hanya nama yang bisa diubah; jumlahnya harus tetap sama dengan
  // ticket_count - 1 (dijaga constraint di DB).
  companions: string[];
};

// Admin-only — RLS restricts writes to authenticated users.
export async function updateRegistration(
  client: SupabaseClient<Database>,
  id: string,
  input: UpdateRegistrationInput
): Promise<Registration> {
  const { data, error } = await client
    .from("registrations")
    .update({
      name: input.name,
      phone: input.phone,
      email: input.email,
      origin: input.origin,
      date_of_birth: input.dateOfBirth,
      message: input.message ?? null,
      companions: input.companions,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(DUPLICATE_REGISTRATION_ERROR);
    }
    throw error;
  }

  return mapRegistration(data);
}

// Admin-only — RLS restricts writes to authenticated users. Hard delete: a
// registration isn't an event, there's no PRD requirement to keep deleted
// participant records around, and the registered_count trigger on
// registrations relies on the row actually being removed.
export async function deleteRegistration(
  client: SupabaseClient<Database>,
  id: string
): Promise<void> {
  const { error } = await client.from("registrations").delete().eq("id", id);
  if (error) throw error;
}
