-- Pendaftar memesan 1-5 kuota dalam satu pendaftaran.
--
-- Pendaftar mengisi data lengkapnya sekali, lalu nama orang yang ikut
-- (companions). Satu baris registrations = satu pesanan, satu nomor
-- registrasi. events.registered_count sekarang menghitung KUOTA, bukan baris.
--
-- Menggantikan register_for_event_batch() dari 0013 (konsep "banyak orang,
-- data lengkap masing-masing" dibatalkan). register_for_event() lama dari
-- 0011 sengaja dibiarkan: kode lama yang masih live tetap jalan (ticket_count
-- default 1) selama jeda antara migrasi ini dan deploy baru.
--
-- Jalankan sekali di Supabase Dashboard > SQL Editor, SEBELUM deploy kode.
-- Semua dalam satu transaksi: kalau satu langkah gagal, tidak ada yang berubah.

begin;

-- 1. Kolom baru. Data lama otomatis jadi 1 kuota tanpa pendamping.
alter table public.registrations
  add column ticket_count int not null default 1,
  add column companions text[] not null default '{}';

alter table public.registrations
  add constraint registrations_ticket_count_check
    check (ticket_count between 1 and 5),
  -- Jumlah nama pendamping harus selalu cocok dengan jumlah kuota.
  add constraint registrations_companions_count_check
    check (cardinality(companions) = ticket_count - 1);

-- 2. Penghitung kuota: tambah/kurang sebanyak ticket_count, bukan 1.
create or replace function public.bump_registered_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.events set registered_count = registered_count + new.ticket_count where id = new.event_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.events set registered_count = greatest(registered_count - old.ticket_count, 0) where id = old.event_id;
    return old;
  elsif tg_op = 'UPDATE' then
    -- Jaga-jaga kalau ticket_count diubah langsung di DB.
    update public.events set registered_count = greatest(registered_count - old.ticket_count + new.ticket_count, 0) where id = new.event_id;
    return new;
  end if;
  return null;
end;
$$;

drop trigger if exists bump_registered_count_update on public.registrations;
create trigger bump_registered_count_update
  after update of ticket_count on public.registrations
  for each row
  when (old.ticket_count is distinct from new.ticket_count)
  execute function public.bump_registered_count();

-- 3. Fungsi pendaftaran baru. Sama seperti 0011 (kunci baris event dengan
-- `for update` supaya rebutan slot terakhir antre), tapi kuota dicek untuk
-- 1 + jumlah pendamping sekaligus.
create or replace function public.register_for_event_tickets(
  p_event_id uuid,
  p_registration_number text,
  p_name text,
  p_phone text,
  p_email text,
  p_origin text,
  p_date_of_birth date,
  p_message text,
  p_companions text[]
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events%rowtype;
  v_companions text[] := coalesce(p_companions, '{}');
  v_tickets int;
begin
  -- Fungsi ini bisa dipanggil langsung pakai anon key (lewati API Next.js),
  -- jadi batas dan isi nama wajib dijaga di sini juga.
  if cardinality(v_companions) > 4
     or exists (select 1 from unnest(v_companions) as c(name) where c.name is null or btrim(c.name) = '')
  then
    raise exception 'INVALID_COMPANIONS';
  end if;
  v_tickets := 1 + cardinality(v_companions);

  select * into v_event
    from public.events
    where id = p_event_id
    for update;

  if not found
     or v_event.published is not true
     or v_event.deleted_at is not null
     or now() < v_event.registration_start
     or now() > v_event.registration_deadline
     or (v_event.max_participants > 0 and v_event.registered_count >= v_event.max_participants)
  then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  -- Masih ada slot, tapi tidak cukup untuk semua kuota yang dipesan.
  if v_event.max_participants > 0
     and v_event.registered_count + v_tickets > v_event.max_participants
  then
    raise exception 'CAPACITY_EXCEEDED';
  end if;

  insert into public.registrations (
    registration_number, event_id, name, phone, email, origin, date_of_birth, message,
    ticket_count, companions
  ) values (
    p_registration_number, p_event_id, p_name, p_phone, p_email, p_origin, p_date_of_birth, p_message,
    v_tickets, v_companions
  );

  return p_registration_number;
end;
$$;

grant execute on function public.register_for_event_tickets(
  uuid, text, text, text, text, text, date, text, text[]
) to anon, authenticated;

-- 4. Fungsi rombongan dari 0013 tidak dipakai lagi.
drop function if exists public.register_for_event_batch(uuid, jsonb);

commit;
