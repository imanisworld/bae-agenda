-- ============================================================
-- DEMO MIXES SEED
-- Purpose: populate the mixes table with portfolio/demo entries
-- for homepage + /mixes page testing.
--
-- Idempotent by title (safe to re-run).
-- ============================================================

with seed_rows as (
  select
    'Street Archives Vol. 1'::text as title,
    'Chicago drill and hip-hop essentials, mixed live.'::text as description,
    'Hip-Hop · Drill'::text as genre,
    3480::int as duration,
    'https://soundcloud.com/djbae'::text as embed_url,
    null::text as cover_url,
    true::boolean as is_featured,
    1::int as sort_order,
    now() - interval '14 days' as published_at
  union all
  select
    'After Hours',
    'Late-night R&B from the classics to now.',
    'R&B · Neo Soul',
    4320,
    'https://soundcloud.com/djbae',
    null,
    true,
    2,
    now() - interval '9 days'
  union all
  select
    'World Tour',
    'Global rhythms and movement-forward energy.',
    'Afrobeats · Dancehall',
    3840,
    'https://soundcloud.com/djbae',
    null,
    false,
    3,
    now() - interval '4 days'
)
insert into mixes (
  title,
  description,
  genre,
  duration,
  embed_url,
  cover_url,
  is_featured,
  sort_order,
  published_at
)
select
  s.title,
  s.description,
  s.genre,
  s.duration,
  s.embed_url,
  s.cover_url,
  s.is_featured,
  s.sort_order,
  s.published_at
from seed_rows s
where not exists (
  select 1
  from mixes m
  where m.title = s.title
);
