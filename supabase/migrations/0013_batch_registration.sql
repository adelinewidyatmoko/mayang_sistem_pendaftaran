-- Satu pendaftar bisa mendaftarkan 1-5 orang sekaligus.
--
-- Sama seperti register_for_event() (0011): kunci baris event dengan
-- `for update` supaya pendaftaran bersamaan untuk slot terakhir antre, bukan
-- sama-sama lolos. Bedanya, kuota dicek untuk SELURUH rombongan sekaligus,
-- dan semua insert ada di satu transaksi: kalau satu email bentrok
-- (unique event_id, email), semuanya batal, tidak ada yang setengah masuk.
--
-- register_for_event() lama sengaja TIDAK di-drop, supaya kode lama yang
-- masih live tetap jalan selama jeda antara migrasi ini dan deploy baru.
--
-- Jalankan sekali di Supabase Dashboard > SQL Editor, SEBELUM deploy kode.

create or replace function public.register_for_event_batch(
  p_event_id uuid,
  p_participants jsonb
) returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events%rowtype;
  v_count int;
  v_numbers text[];
begin
  -- Fungsi ini bisa dipanggil langsung pakai anon key (lewati API Next.js),
  -- jadi batas 1-5 orang wajib dijaga di sini juga, bukan cuma di route.
  if jsonb_typeof(p_participants) is distinct from 'array' then
    raise exception 'INVALID_PARTICIPANTS';
  end if;
  v_count := jsonb_array_length(p_participants);
  if v_count < 1 or v_count > 5 then
    raise exception 'INVALID_PARTICIPANTS';
  end if;

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

  -- Masih ada slot, tapi tidak cukup untuk seluruh rombongan.
  if v_event.max_participants > 0
     and v_event.registered_count + v_count > v_event.max_participants
  then
    raise exception 'CAPACITY_EXCEEDED';
  end if;

  -- Trigger bump_registered_count tetap jalan per baris.
  with inserted as (
    insert into public.registrations (
      registration_number, event_id, name, phone, email, origin, date_of_birth, message
    )
    select p.registration_number, p_event_id, p.name, p.phone, p.email, p.origin, p.date_of_birth, p.message
      from jsonb_to_recordset(p_participants) as p(
        registration_number text,
        name text,
        phone text,
        email text,
        origin text,
        date_of_birth date,
        message text
      )
    returning registration_number
  )
  select array_agg(registration_number) into v_numbers from inserted;

  return v_numbers;
end;
$$;

grant execute on function public.register_for_event_batch(uuid, jsonb) to anon, authenticated;
