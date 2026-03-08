-- ============================================================
-- SITE CONTENT BACKFILL
-- Purpose:
-- 1) Ensure current CMS keys exist with sane defaults
-- 2) Remove legacy keys from earlier schema iterations
--
-- Safe to run multiple times.
-- ============================================================

insert into site_content (key, label, value) values
  ('hero_title',         'Hero Title',        'THE BAE AGENDA'),
  ('hero_subtitle',      'Hero Subtitle',     'From intimate gatherings to club takeovers — music is always the agenda.'),
  ('hero_cta_primary',   'Primary Button',    'Book Your Event'),
  ('hero_cta_secondary', 'Secondary Button',  'Listen to Mixes'),
  ('about_quote',        'Bio / About',       'Chicago-based DJ, curator, and experience architect. Every set is built to be felt.'),
  ('instagram_url',      'Instagram URL',     'https://www.instagram.com/dj_b.a.e/'),
  ('soundcloud_url',     'SoundCloud URL',    'https://soundcloud.com/djbae'),
  ('youtube_url',        'YouTube URL',       'https://www.youtube.com/channel/UCjEiMW5l_Go9vSHudx5VPEw'),
  ('booking_email',      'Booking Email',     'bookings@thebaeagenda.com')
on conflict (key) do update
set
  label = excluded.label,
  value = coalesce(site_content.value, excluded.value);

-- Remove legacy keys that are no longer used by the app
delete from site_content
where key in ('bio', 'tagline', 'hero_cta', 'booking_intro');
