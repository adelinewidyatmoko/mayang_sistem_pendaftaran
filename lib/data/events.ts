import { SupabaseClient } from "@supabase/supabase-js";

import { Database } from "@/lib/supabase/types";
import { EventItem } from "@/lib/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

function mapEvent(row: EventRow): EventItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    coverImage: row.cover_image,
    location: row.location,
    eventStart: row.event_start,
    eventEnd: row.event_end,
    registrationStart: row.registration_start,
    registrationDeadline: row.registration_deadline,
    timezone: row.timezone,
    maxParticipants: row.max_participants,
    registeredCount: row.registered_count,
    requirements: row.requirements,
    messageEnabled: row.message_enabled,
    messageLabel: row.message_label,
    published: row.published,
  };
}

export async function getPublishedEvents(
  client: SupabaseClient<Database>
): Promise<EventItem[]> {
  const { data, error } = await client
    .from("events")
    .select("*")
    .eq("published", true)
    .is("deleted_at", null)
    .order("event_start", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapEvent);
}

export async function getEventById(
  client: SupabaseClient<Database>,
  id: string
): Promise<EventItem | null> {
  const { data, error } = await client
    .from("events")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data ? mapEvent(data) : null;
}

// Admin-only — RLS restricts this to authenticated users, so call with the
// browser/server client while signed in, not the anon client.
export async function getAllEvents(client: SupabaseClient<Database>): Promise<EventItem[]> {
  const { data, error } = await client
    .from("events")
    .select("*")
    .is("deleted_at", null)
    .order("event_start", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapEvent);
}

export type EventInput = {
  title: string;
  description: string;
  coverImage: string | null;
  location: string;
  eventStart: string;
  eventEnd: string;
  registrationStart: string;
  registrationDeadline: string;
  timezone: string;
  maxParticipants: number;
  requirements: string[];
  messageEnabled: boolean;
  messageLabel: string;
  published: boolean;
};

function toRow(input: Partial<EventInput>): Database["public"]["Tables"]["events"]["Update"] {
  const row: Database["public"]["Tables"]["events"]["Update"] = {};
  if (input.title !== undefined) row.title = input.title;
  if (input.description !== undefined) row.description = input.description;
  if (input.coverImage !== undefined) row.cover_image = input.coverImage;
  if (input.location !== undefined) row.location = input.location;
  if (input.eventStart !== undefined) row.event_start = input.eventStart;
  if (input.eventEnd !== undefined) row.event_end = input.eventEnd;
  if (input.registrationStart !== undefined) row.registration_start = input.registrationStart;
  if (input.registrationDeadline !== undefined)
    row.registration_deadline = input.registrationDeadline;
  if (input.timezone !== undefined) row.timezone = input.timezone;
  if (input.maxParticipants !== undefined) row.max_participants = input.maxParticipants;
  if (input.requirements !== undefined) row.requirements = input.requirements;
  if (input.messageEnabled !== undefined) row.message_enabled = input.messageEnabled;
  if (input.messageLabel !== undefined) row.message_label = input.messageLabel;
  if (input.published !== undefined) row.published = input.published;
  return row;
}

export async function createEvent(
  client: SupabaseClient<Database>,
  input: EventInput
): Promise<EventItem> {
  const { data, error } = await client
    .from("events")
    .insert({
      title: input.title,
      description: input.description,
      cover_image: input.coverImage,
      location: input.location,
      event_start: input.eventStart,
      event_end: input.eventEnd,
      registration_start: input.registrationStart,
      registration_deadline: input.registrationDeadline,
      timezone: input.timezone,
      max_participants: input.maxParticipants,
      requirements: input.requirements,
      message_enabled: input.messageEnabled,
      message_label: input.messageLabel,
      published: input.published,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapEvent(data);
}

export async function updateEvent(
  client: SupabaseClient<Database>,
  id: string,
  input: Partial<EventInput>
): Promise<EventItem> {
  const { data, error } = await client
    .from("events")
    .update(toRow(input))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapEvent(data);
}

// Hard-deletes an event with no registrations (nothing to lose), otherwise
// soft-deletes so existing registrants' data survives — registrations
// .event_id is `on delete cascade`, so hard-deleting an event that already
// has signups would silently wipe all of them too. Per PRD §16: soft
// delete/archive only once an event actually has registration data.
// Checked live here (not from a possibly-stale count already in the admin's
// browser) so the decision is always correct at the moment of deletion.
export async function deleteEvent(client: SupabaseClient<Database>, id: string): Promise<void> {
  const { count, error: countError } = await client
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id);

  if (countError) throw countError;

  if (!count) {
    const { error } = await client.from("events").delete().eq("id", id);
    if (error) throw error;
    return;
  }

  const { error } = await client
    .from("events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
