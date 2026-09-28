-- Keep public event-media reads on the anon role only.
-- Authenticated admin reads are handled by event_media_admin_all, avoiding
-- overlapping permissive SELECT policies for the authenticated role.

drop policy if exists event_media_public_read on public.event_media;

create policy event_media_public_read
on public.event_media
for select
to anon
using (
  public = true
  and exists (
    select 1
    from public.events
    where events.id = event_media.event_id
      and events.public = true
  )
);
