-- Cleanup after the RLS investigation. The real bug was in application
-- code (lib/data/registrations.ts calling .select() after .insert(), which
-- Postgres rejects because anon has no SELECT policy on registrations) —
-- none of the policy rewrites were actually necessary, and the "always
-- allow" diagnostic policy must be removed since it bypasses the
-- registration-window/capacity check entirely.

drop policy if exists "diagnostic always allow registration insert" on public.registrations;
drop function if exists public.diagnose_registrations_rls();
