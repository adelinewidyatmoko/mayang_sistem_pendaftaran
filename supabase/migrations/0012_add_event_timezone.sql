-- Admin can now pick which Indonesia timezone an event's dates are in
-- (WIB/WITA/WIT), instead of every event being silently assumed WIB.
-- Fixed offsets only (Indonesia has no DST), so a check constraint against
-- the 3 real IANA zones is enough — no timezone name table needed.
alter table public.events
  add column timezone text not null default 'Asia/Jakarta';

alter table public.events
  add constraint events_timezone_check
  check (timezone in ('Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'));
