-- Keep the internal Booking ↔ Event foreign key out of the public Data API.
-- RLS controls rows; column privileges prevent booking_id from being selected at all.
revoke select on table public.events from anon, authenticated;

grant select (
  id,
  title,
  slug,
  event_date,
  event_timezone,
  venue,
  city,
  description,
  public,
  featured,
  show_description,
  created_at,
  updated_at
) on table public.events to anon, authenticated;
