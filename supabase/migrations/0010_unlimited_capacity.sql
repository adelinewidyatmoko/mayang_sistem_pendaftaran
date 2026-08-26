-- max_participants = 0 now means "unlimited" (see lib/event-status.ts
-- isUnlimitedCapacity), not "zero seats". Without this, the registration
-- insert policy's capacity check (registered_count < max_participants)
-- would always be false when max_participants = 0, permanently blocking
-- registration for any event an admin intends to leave uncapped.

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
        and (e.max_participants <= 0 or e.registered_count < e.max_participants)
    )
  );
