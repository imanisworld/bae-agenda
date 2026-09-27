-- Remove unsupported Club Plex residency wording from portfolio content.
-- Keep the documented appearances while avoiding a resident-DJ claim.

update public.portfolio_entries
set
  event_name = case
    when event_name = 'Club Plex Resident DJ' then 'Club Plex'
    else event_name
  end,
  tags = array_remove(tags, 'Residency')
where lower(coalesce(event_name, '')) like '%plex%'
   or lower(coalesce(venue, '')) like '%plex%';
