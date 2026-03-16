-- ============================================================
-- CLEAN UP UNUSED PUBLIC CONTENT KEYS
-- Purpose:
-- 1) Remove obsolete hero CTA keys from site_content
-- 2) Normalize the legacy SoundCloud profile URL if it still
--    points at the old djbae account
--
-- Safe to run multiple times.
-- ============================================================

delete from site_content
where key in ('hero_cta_primary', 'hero_cta_secondary');

update site_content
set value = 'https://soundcloud.com/deejaybae'
where key = 'soundcloud_url'
  and value = 'https://soundcloud.com/djbae';
