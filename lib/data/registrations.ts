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
    createdAt: row.created_at,
  };
}

export type CreateRegistrationInput = {
  registrationNumber: string;
  eventId: string;
  name: string;
  phone: string;
  email: string;
  origin: string;
  dateOfBirth: string;
  message?: string | null;
};

// Postgres unique_violation on (event_id, email) — PRD §24 duplicate check.
export const DUPLICATE_REGISTRATION_ERROR = "DUPLICATE_REGISTRATION";

// Goes through the register_for_event() RPC (see
// supabase/migrations/0011_atomic_registration_insert.sql) instead of a
// plain `.insert()`. That function runs as security definer
// and takes `select ... for update` on the event row before checking
// capacity/window, so two concurrent registrations for the last open seat
// serialize instead of both reading the same stale registered_count — the
// old RLS `with check` couldn't do that. It's also now the *only* insert
// path RLS allows, so this isn't just an optimization a client could route
// around by calling `.insert()` directly with the anon key.
export async function createRegistration(
  client: SupabaseClient<Database>,
  input: CreateRegistrationInput
): Promise<{ registrationNumber: string }> {
  const { error } = await client.rpc("register_for_event", {
    p_event_id: input.eventId,
    p_registration_number: input.registrationNumber,
    p_name: input.name,
    p_phone: input.phone,
    p_email: input.email,
    p_origin: input.origin,
    p_date_of_birth: input.dateOfBirth,
    p_message: input.message ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error(DUPLICATE_REGISTRATION_ERROR);
    }
    throw error;
  }

  return { registrationNumber: input.registrationNumber };
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
