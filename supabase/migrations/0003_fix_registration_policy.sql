-- Forces the "anyone can register" policy on registrations back to the
-- current correct definition, regardless of which earlier version of
-- 0001_init.sql actually got run live. A live insert test showed the
-- active policy rejecting a registration that satisfies every condition
-- when checked directly via SQL — strongly suggesting a stale/earlier
-- policy body is what's actually active, not this one.
-- Run this once in Supabase Dashboard > SQL Editor.

drop policy if exists "anyone can register for a published event" on public.registrations;
drop policy if exists "anyone can register for a published open event" on public.registrations;

create policy "anyone can register for a published open event"
  on public.registrations for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and e.published = true
        and e.deleted_at is null
        and now() >= e.registration_start
        and now() <= e.registration_deadline
        and e.registered_count < e.max_participants
    )
  );
