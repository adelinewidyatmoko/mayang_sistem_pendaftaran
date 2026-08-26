-- Atomic, capacity-safe registration insert.
--
-- The previous RLS `with check` on public.registrations re-read
-- events.registered_count with no lock, so two concurrent inserts near the
-- last open seat could both pass the check before either one's insert (and
-- the count-bumping trigger) committed — PRD §44 edge case 6 ("Dua
-- pengguna mendaftar bersamaan untuk slot terakhir") explicitly calls this
-- out as required to handle correctly.
--
-- public.register_for_event() fixes that by locking the event row
-- (`select ... for update`) before checking capacity/window, so a second
-- concurrent call for the same event waits for the first to commit instead
-- of reading a stale count. Bot/spam mitigation for this endpoint is
-- handled with a honeypot field + submit-timing check in the Next.js route
-- instead of a DB-backed rate limiter — no extra table, no extra
-- Supabase round-trip on every request.
--
-- Run this once in Supabase Dashboard > SQL Editor.

-- security definer means this bypasses RLS, so every condition the old RLS
-- policy checked has to be re-checked explicitly in here instead.
create or replace function public.register_for_event(
  p_event_id uuid,
  p_registration_number text,
  p_name text,
  p_phone text,
  p_email text,
  p_origin text,
  p_date_of_birth date,
  p_message text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events%rowtype;
begin
  select * into v_event
    from public.events
    where id = p_event_id
    for update; -- locks the row so a concurrent call for the same event
                -- waits here instead of re-reading a stale registered_count

  if not found
     or v_event.published is not true
     or v_event.deleted_at is not null
     or now() < v_event.registration_start
     or now() > v_event.registration_deadline
     or (v_event.max_participants > 0 and v_event.registered_count >= v_event.max_participants)
  then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  insert into public.registrations (
    registration_number, event_id, name, phone, email, origin, date_of_birth, message
  ) values (
    p_registration_number, p_event_id, p_name, p_phone, p_email, p_origin, p_date_of_birth, p_message
  );

  return p_registration_number;
end;
$$;

grant execute on function public.register_for_event(
  uuid, text, text, text, text, text, date, text
) to anon, authenticated;

-- register_for_event() is now the only sanctioned way to insert a
-- registration. Drop the old permissive RLS insert policy so a direct REST
-- call with the public anon key can't reach the old racy, unlocked path.
drop policy if exists "anyone can register for a published event" on public.registrations;
drop policy if exists "anyone can register for a published open event" on public.registrations;
