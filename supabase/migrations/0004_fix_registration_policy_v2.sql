-- 0003 recreated the policy but the insert still failed even though the
-- exact same conditions checked out true via a plain SELECT. Rewriting with
-- every column fully table-qualified (including the outer `event_id`
-- reference, explicit as `registrations.event_id`) in case the bare
-- `event_id` inside the correlated subquery wasn't resolving the way it's
-- supposed to. Run this once in Supabase Dashboard > SQL Editor.

drop policy if exists "anyone can register for a published event" on public.registrations;
drop policy if exists "anyone can register for a published open event" on public.registrations;

create policy "anyone can register for a published open event"
  on public.registrations for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.events e
      where e.id = registrations.event_id
        and e.published = true
        and e.deleted_at is null
        and e.registration_start <= now()
        and e.registration_deadline >= now()
        and e.registered_count < e.max_participants
    )
  );
