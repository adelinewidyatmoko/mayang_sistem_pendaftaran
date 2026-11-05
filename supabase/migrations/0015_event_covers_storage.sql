-- Cover images move out of events.cover_image (base64 data URIs) into a
-- public Storage bucket. The column now holds the public URL instead, so
-- every events query stops dragging megabytes of image data along —
-- that payload is what exhausted the project's egress quota.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-covers', 'event-covers', true, 5242880, array['image/*'])
on conflict (id) do nothing;

-- Public bucket: anyone can read via the public URL. Only admins
-- (authenticated users, same rule as the events table) can write.
create policy "admins can upload event covers"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'event-covers');

create policy "admins can update event covers"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'event-covers')
  with check (bucket_id = 'event-covers');

create policy "admins can delete event covers"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'event-covers');
