-- Direct admin uploads for the already-live Events media gallery.
-- The Portfolio Full Archive media work remains intentionally excluded.

alter table public.event_media
  add column if not exists storage_path text;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'site-media',
  'site-media',
  true,
  104857600,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists site_media_admin_upload on storage.objects;

create policy site_media_admin_upload
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site-media'
  and private.is_admin_user()
);

comment on column public.event_media.storage_path is
  'Supabase Storage object path when media was uploaded through the admin. Null for externally hosted media.';
