-- DJ B.A.E. Manager foundation.
-- Additive only: creates new private business-development tables.
--
-- Production rule:
-- Apply this exact reviewed migration only. Do not run a blanket db push while
-- the production migration ledger remains historically drifted from the repo.

do $$
begin
  if to_regclass('public.manager_profiles') is not null
     or to_regclass('public.manager_opportunities') is not null then
    raise exception 'Manager tables already exist; stop and inspect production before continuing';
  end if;

  if to_regclass('public.bookings') is null then
    raise exception 'Required table public.bookings is missing';
  end if;

  if to_regprocedure('public.touch_updated_at()') is null then
    raise exception 'Required function public.touch_updated_at() is missing';
  end if;
end
$$;

create table public.manager_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null unique default 'dj_bae',
  display_name text not null default 'DJ B.A.E.',
  home_market text,
  minimum_fee numeric(10,2),
  target_hourly_rate numeric(10,2),
  max_drive_minutes integer check (max_drive_minutes is null or max_drive_minutes >= 0),
  max_one_way_miles numeric(8,2) check (max_one_way_miles is null or max_one_way_miles >= 0),
  minimum_notice_days integer check (minimum_notice_days is null or minimum_notice_days >= 0),
  preferred_event_types text[] not null default '{}',
  excluded_event_types text[] not null default '{}',
  target_markets text[] not null default '{}',
  target_brands text[] not null default '{}',
  genres text[] not null default '{}',
  equipment_notes text,
  travel_notes text,
  deal_breakers text,
  website_url text,
  instagram_url text,
  press_kit_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.manager_opportunities (
  id uuid primary key default gen_random_uuid(),
  opportunity_type text not null default 'dj_gig'
    check (opportunity_type in ('dj_gig','brand_deal','residency','festival','creator','collaboration','other')),
  source_type text not null default 'manual'
    check (source_type in ('manual','website','venue','dj_referral','instagram','x','linkedin','email','other')),
  status text not null default 'found'
    check (status in ('found','qualified','review','outreach_ready','applied','contacted','follow_up','negotiating','booked','passed','lost')),
  title text not null,
  organization text,
  venue_name text,
  source_url text,
  source_reference text,
  contact_name text,
  contact_email text,
  contact_phone text,
  location_address text,
  location_city text,
  location_state text,
  location_country text not null default 'US',
  event_date date,
  application_deadline date,
  compensation_min numeric(10,2),
  compensation_max numeric(10,2),
  compensation_currency text not null default 'USD',
  compensation_notes text,
  travel_minutes integer check (travel_minutes is null or travel_minutes >= 0),
  travel_miles numeric(8,2) check (travel_miles is null or travel_miles >= 0),
  travel_cost_estimate numeric(10,2) check (travel_cost_estimate is null or travel_cost_estimate >= 0),
  travel_covered boolean,
  lodging_provided boolean,
  equipment_notes text,
  requirements text,
  why_fit text,
  risk_notes text,
  internal_notes text,
  fit_score integer check (fit_score is null or fit_score between 0 and 100),
  next_action text,
  next_action_at date,
  applied_at timestamptz,
  last_contacted_at timestamptz,
  booked_at timestamptz,
  linked_booking_id uuid references public.bookings(id) on delete set null,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    compensation_min is null
    or compensation_max is null
    or compensation_max >= compensation_min
  )
);

alter table public.manager_profiles enable row level security;
alter table public.manager_opportunities enable row level security;

revoke all on table public.manager_profiles from public, anon, authenticated;
revoke all on table public.manager_opportunities from public, anon, authenticated;

grant select, insert, update, delete on table public.manager_profiles to service_role;
grant select, insert, update, delete on table public.manager_opportunities to service_role;

create index manager_opportunities_status_idx
  on public.manager_opportunities (status);

create index manager_opportunities_event_date_idx
  on public.manager_opportunities (event_date)
  where event_date is not null;

create index manager_opportunities_deadline_idx
  on public.manager_opportunities (application_deadline)
  where application_deadline is not null;

create index manager_opportunities_created_at_idx
  on public.manager_opportunities (created_at desc);

create index manager_opportunities_linked_booking_id_idx
  on public.manager_opportunities (linked_booking_id)
  where linked_booking_id is not null;

create trigger manager_profiles_touch_updated_at
before update on public.manager_profiles
for each row execute function public.touch_updated_at();

create trigger manager_opportunities_touch_updated_at
before update on public.manager_opportunities
for each row execute function public.touch_updated_at();

comment on table public.manager_profiles is
  'Private DJ manager preferences used for opportunity qualification and future automation. Server/service-role access only.';

comment on table public.manager_opportunities is
  'Private business-development pipeline for DJ gigs, brand deals, residencies, festivals, creator opportunities, and outreach. Server/service-role access only.';

insert into public.manager_profiles (
  profile_key,
  display_name,
  home_market,
  website_url,
  instagram_url
)
values (
  'dj_bae',
  'DJ B.A.E.',
  'Indianapolis, IN',
  'https://thebaeagenda.com',
  'https://www.instagram.com/dj_b.a.e/'
);
