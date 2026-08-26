-- Removing the IP-tracking feature entirely (not worth the schema-cache
-- reload hassle right now) — drops the columns added by the now-deleted
-- ip-tracking migration.

alter table public.registrations
  drop column if exists ip_address,
  drop column if exists ip_location;
