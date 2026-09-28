-- Media gallery records for full Portfolio / Past Work archive entries.
-- A portfolio entry may have many public photos/videos. The existing photo_url
-- remains the cover/primary image and can appear first in the gallery.

create table if not exists public.portfolio_media (
  id uuid primary key default gen_random_uuid(),
  portfolio_entry_id uuid not null references public.portfolio_entries(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  media_url text not null,
  poster_url text,
  caption text,
  sort_order integer not null default 0,
  public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists portfolio_media_entry_sort_idx
  on public.portfolio_media (portfolio_entry_id, sort_order, created_at);

alter table public.portfolio_media enable row level security;

revoke all on table public.portfolio_media from anon, authenticated;

grant select (
  id,
  portfolio_entry_id,
  media_type,
  media_url,
  poster_url,
  caption,
  sort_order,
  public,
  created_at,
  updated_at
) on table public.portfolio_media to anon, authenticated;

grant insert, update, delete on table public.portfolio_media to authenticated;

drop policy if exists portfolio_media_public_read on public.portfolio_media;
create policy portfolio_media_public_read
on public.portfolio_media
for select
to anon
using (
  public = true
  and exists (
    select 1
    from public.portfolio_entries
    where portfolio_entries.id = portfolio_media.portfolio_entry_id
      and portfolio_entries.status = 'published'
  )
);

drop policy if exists portfolio_media_admin_all on public.portfolio_media;
create policy portfolio_media_admin_all
on public.portfolio_media
for all
to authenticated
using (private.is_admin_user())
with check (private.is_admin_user());

drop trigger if exists portfolio_media_updated_at on public.portfolio_media;
create trigger portfolio_media_updated_at
  before update on public.portfolio_media
  for each row execute function public.touch_updated_at();

comment on table public.portfolio_media is
  'Photo/video archive for published portfolio entries on the Full Archive experience.';
