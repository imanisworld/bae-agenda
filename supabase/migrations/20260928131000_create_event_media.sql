-- Event media archive for Past Events galleries.
-- Media records store URLs only; file upload/storage can be layered on later
-- without changing the public gallery data model.

create table if not exists public.event_media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  media_url text not null,
  poster_url text,
  caption text,
  sort_order integer not null default 0,
  public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_media_event_sort_idx
  on public.event_media (event_id, sort_order, created_at);

alter table public.event_media enable row level security;

revoke all on table public.event_media from anon, authenticated;

grant select (
  id,
  event_id,
  media_type,
  media_url,
  poster_url,
  caption,
  sort_order,
  public,
  created_at,
  updated_at
) on table public.event_media to anon, authenticated;

grant insert, update, delete on table public.event_media to authenticated;

drop policy if exists event_media_public_read on public.event_media;
create policy event_media_public_read
on public.event_media
for select
to anon, authenticated
using (
  public = true
  and exists (
    select 1
    from public.events
    where events.id = event_media.event_id
      and events.public = true
  )
);

drop policy if exists event_media_admin_all on public.event_media;
create policy event_media_admin_all
on public.event_media
for all
to authenticated
using (private.is_admin_user())
with check (private.is_admin_user());

drop trigger if exists event_media_updated_at on public.event_media;
create trigger event_media_updated_at
  before update on public.event_media
  for each row execute function public.touch_updated_at();

comment on table public.event_media is
  'Public-facing photo/video archive for events. Media files may live in Supabase Storage or another approved host.';
