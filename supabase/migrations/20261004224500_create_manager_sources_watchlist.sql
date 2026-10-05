-- Manager Sources / Watchlist foundation.
-- Additive only. These tables are private, server-managed Manager data.

do $$
begin
  if to_regclass('public.manager_sources') is not null
     or to_regclass('public.manager_source_signals') is not null then
    raise exception 'Manager source tables already exist; stop and inspect before continuing';
  end if;

  if to_regclass('public.manager_opportunities') is null then
    raise exception 'Required table public.manager_opportunities is missing';
  end if;

  if to_regprocedure('public.touch_updated_at()') is null then
    raise exception 'Required function public.touch_updated_at() is missing';
  end if;
end
$$;

create table public.manager_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_kind text not null default 'other'
    check (source_kind in ('venue','dj','promoter','event_brand','brand','agency','other')),
  platform text not null default 'website'
    check (platform in ('instagram','website','x','linkedin','facebook','other')),
  url text not null unique,
  handle text,
  location_city text,
  location_state text,
  active boolean not null default true,
  check_frequency_hours integer not null default 24
    check (check_frequency_hours between 1 and 720),
  check_reliability text not null default 'partial'
    check (check_reliability in ('full','partial','manual')),
  last_checked_at timestamptz,
  last_seen_marker text,
  last_seen_at timestamptz,
  latest_signal_at timestamptz,
  recommended_demo text,
  recommended_demo_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.manager_source_signals (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.manager_sources(id) on delete cascade,
  signal_type text not null default 'other'
    check (signal_type in ('post','event','booking_call','job','application','venue_programming','other')),
  status text not null default 'new'
    check (status in ('new','relevant','ignored','converted')),
  title text not null,
  url text,
  published_at timestamptz,
  discovered_at timestamptz not null default now(),
  summary text,
  fingerprint text not null,
  linked_opportunity_id uuid references public.manager_opportunities(id) on delete set null,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_id, fingerprint)
);

alter table public.manager_sources enable row level security;
alter table public.manager_source_signals enable row level security;

revoke all on table public.manager_sources from public, anon, authenticated;
revoke all on table public.manager_source_signals from public, anon, authenticated;

grant select, insert, update, delete on table public.manager_sources to service_role;
grant select, insert, update, delete on table public.manager_source_signals to service_role;

create index manager_sources_active_next_check_idx
  on public.manager_sources (active, last_checked_at);

create index manager_source_signals_source_discovered_idx
  on public.manager_source_signals (source_id, discovered_at desc);

create index manager_source_signals_status_idx
  on public.manager_source_signals (status, discovered_at desc);

create index manager_source_signals_linked_opportunity_idx
  on public.manager_source_signals (linked_opportunity_id)
  where linked_opportunity_id is not null;

create trigger manager_sources_touch_updated_at
before update on public.manager_sources
for each row execute function public.touch_updated_at();

comment on table public.manager_sources is
  'Private Manager watchlist of DJs, venues, promoters, event brands, agencies, and other discovery sources.';

comment on table public.manager_source_signals is
  'New public posts, events, booking calls, jobs, and other signals discovered from Manager watchlist sources.';

insert into public.manager_sources (
  name, source_kind, platform, url, handle, check_reliability,
  recommended_demo, recommended_demo_reason, notes
)
values
  (
    'Jazz Is Dead',
    'event_brand',
    'instagram',
    'https://www.instagram.com/jazzisdead/',
    '@jazzisdead',
    'partial',
    'Lounge / Soul / R&B',
    'Lead with musicality, soul/R&B depth, and smooth genre movement.',
    'Instagram chronology may be incomplete through public web indexing; use public web signals without claiming exhaustive post coverage.'
  ),
  (
    'Elevate Social',
    'event_brand',
    'instagram',
    'https://www.instagram.com/elevatesocial/',
    '@elevatesocial',
    'partial',
    'Open Format / Social',
    'Use recognizable R&B, hip-hop, pop, and dance with clear energy progression.',
    'Watch for event announcements, partnership calls, city launches, and DJ/creative booking signals.'
  ),
  (
    'EGNEVER',
    'dj',
    'instagram',
    'https://www.instagram.com/egnever.egnever/',
    '@egnever.egnever',
    'partial',
    null,
    null,
    'Reference source: mine venues, promoters, collaborators, and recurring event relationships rather than treating every post as an opportunity.'
  ),
  (
    'Solano Brew',
    'venue',
    'instagram',
    'https://www.instagram.com/solanobrew/',
    '@solanobrew',
    'partial',
    'Open Format / Live Venue',
    'Use a flexible live-venue set if travel is justified or covered.',
    'Outside current local travel rule by default; still useful as a venue/programming reference source.'
  ),
  (
    'DUSK',
    'venue',
    'website',
    'https://www.dusk-lounge.com/',
    null,
    'partial',
    'Lounge / House',
    'Deep/Afro House and lounge-oriented programming make a smoother house-forward demo the strongest fit.',
    'Indianapolis outreach target; watch programming and local DJ partnership signals.'
  );

update public.manager_sources
set
  location_city = 'Indianapolis',
  location_state = 'IN'
where name = 'DUSK';
