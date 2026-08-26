-- Mayang Collection — initial schema (events + registrations)
-- Run this once in Supabase Dashboard > SQL Editor.
--
-- Admin accounts are Supabase Auth users (auth.users) — there is no
-- separate admins table. Anyone with an account in this project is treated
-- as an admin, per PRD's 2-tier Guest/Admin model.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  cover_image text,
  location text not null default '',
  event_start timestamptz not null,
  event_end timestamptz not null,
  registration_start timestamptz not null,
  registration_deadline timestamptz not null,
  max_participants int not null default 0,
  requirements text[] not null default '{}',
  message_enabled boolean not null default false,
  message_label text not null default '',
  file_enabled boolean not null default false,
  file_label text not null default '',
  allowed_file_types text[] not null default '{}',
  max_file_size int,
  published boolean not null default false,
  -- Maintained by the bump_registered_count trigger below (not writable by
  -- the app directly) so the public site can show live capacity/"Kuota
  -- Penuh" without needing read access to the registrations table.
  registered_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists events_published_idx on public.events (published) where deleted_at is null;

-- ---------------------------------------------------------------------
-- registrations
-- ---------------------------------------------------------------------
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  registration_number text not null unique,
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  phone text not null,
  email text not null,
  origin text not null default '',
  date_of_birth date not null,
  message text,
  file_url text,
  file_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, email)
);

create index if not exists registrations_event_id_idx on public.registrations (event_id);

-- ---------------------------------------------------------------------
-- events.registered_count auto-maintained by registrations insert/delete
-- ---------------------------------------------------------------------
create or replace function public.bump_registered_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.events set registered_count = registered_count + 1 where id = new.event_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.events set registered_count = greatest(registered_count - 1, 0) where id = old.event_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists bump_registered_count_insert on public.registrations;
create trigger bump_registered_count_insert
  after insert on public.registrations
  for each row execute function public.bump_registered_count();

drop trigger if exists bump_registered_count_delete on public.registrations;
create trigger bump_registered_count_delete
  after delete on public.registrations
  for each row execute function public.bump_registered_count();

-- ---------------------------------------------------------------------
-- updated_at auto-bump trigger
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.events;
create trigger set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.registrations;
create trigger set_updated_at
  before update on public.registrations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.events enable row level security;
alter table public.registrations enable row level security;

-- events: public can only see published, non-deleted events.
create policy "public can read published events"
  on public.events for select
  to anon
  using (published = true and deleted_at is null);

-- events: admins (any authenticated user in this project) have full access.
create policy "admins can read all events"
  on public.events for select
  to authenticated
  using (true);

create policy "admins can insert events"
  on public.events for insert
  to authenticated
  with check (true);

create policy "admins can update events"
  on public.events for update
  to authenticated
  using (true)
  with check (true);

create policy "admins can delete events"
  on public.events for delete
  to authenticated
  using (true);

-- registrations: anyone can register (guest, no login), but only for an
-- event that actually exists, is published, isn't soft-deleted, is
-- currently within its registration window, and isn't already full.
-- Enforced here (not just in the React form) so the check can't be
-- bypassed by calling the API directly with the public anon key.
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

-- registrations: participant data is never publicly readable — admins only.
create policy "admins can read registrations"
  on public.registrations for select
  to authenticated
  using (true);

create policy "admins can update registrations"
  on public.registrations for update
  to authenticated
  using (true)
  with check (true);

create policy "admins can delete registrations"
  on public.registrations for delete
  to authenticated
  using (true);
