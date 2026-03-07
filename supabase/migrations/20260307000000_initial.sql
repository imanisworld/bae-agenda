-- ============================================================
-- THE BAE AGENDA — Initial Database Migration
-- Canonical schema. Keep in sync with types/database.ts.
--
-- Run via:  supabase db push
-- Or paste into: Supabase dashboard → SQL Editor
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Helper: auto-update updated_at ──────────────────────────────
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Table: clients ───────────────────────────────────────────────
create table if not exists clients (
  id           uuid primary key default uuid_generate_v4(),
  first_name   text not null,
  last_name    text,                        -- nullable: some clients have one name
  email        text unique not null,
  phone        text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger clients_updated_at
  before update on clients
  for each row execute function touch_updated_at();

-- ── Table: events ────────────────────────────────────────────────
create table if not exists events (
  id          uuid        primary key default uuid_generate_v4(),
  title       text        not null,
  slug        text        unique not null,   -- used for /events/[slug] routing
  event_date  timestamptz not null,          -- determines upcoming vs past
  venue       text,
  city        text,
  description text,
  public      boolean     not null default true,   -- false = admin-only draft
  featured    boolean     not null default false,  -- true = shown on homepage
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger events_updated_at
  before update on events
  for each row execute function touch_updated_at();

-- ── Table: bookings ──────────────────────────────────────────────
create table if not exists bookings (
  id             uuid primary key default uuid_generate_v4(),
  client_id      uuid references clients(id) on delete set null,
  event_name     text not null,             -- name of the event being booked for
  event_type     text,                      -- 'Birthday', 'Wedding', 'Corporate', etc.
  event_date     timestamptz not null,
  end_time       timestamptz,
  venue          text,
  city           text,
  package        text,                      -- package name, e.g. 'The Agenda'
  hours          integer,
  quote          numeric(10, 2),            -- quoted price in USD
  deposit_amount numeric(10, 2),
  status         text not null default 'inquiry'
                   check (status in ('inquiry', 'confirmed', 'completed', 'cancelled')),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger bookings_updated_at
  before update on bookings
  for each row execute function touch_updated_at();

-- ── Table: payments ──────────────────────────────────────────────
create table if not exists payments (
  id           uuid primary key default uuid_generate_v4(),
  booking_id   uuid not null references bookings(id) on delete cascade,
  amount       numeric(10, 2) not null,
  type         text not null
                 check (type in ('deposit', 'balance', 'full', 'refund')),
  method       text
                 check (method in ('cash', 'venmo', 'zelle', 'stripe', 'other')),
  status       text not null default 'pending'
                 check (status in ('pending', 'received', 'refunded')),
  paid_at      timestamptz,                -- when payment was received
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger payments_updated_at
  before update on payments
  for each row execute function touch_updated_at();

-- ── Table: mixes ─────────────────────────────────────────────────
create table if not exists mixes (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  description  text,
  genre        text,
  duration     integer,                    -- duration in seconds
  embed_url    text,                       -- SoundCloud / YouTube embed URL
  cover_url    text,
  is_featured  boolean not null default false,
  sort_order   integer not null default 0,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger mixes_updated_at
  before update on mixes
  for each row execute function touch_updated_at();

-- ── Table: site_content ──────────────────────────────────────────
-- Key/value store for editable public site copy (bio, tagline, etc.)
-- V1: plain text values. No type column — add richer support later if needed.
create table if not exists site_content (
  id         uuid primary key default uuid_generate_v4(),
  key        text unique not null,          -- e.g. 'bio', 'tagline', 'hero_cta'
  value      text,
  label      text,                          -- human-readable label for admin UI
  updated_at timestamptz not null default now()
);

create trigger site_content_updated_at
  before update on site_content
  for each row execute function touch_updated_at();

-- ── Table: notes ─────────────────────────────────────────────────
-- Internal admin notes. Tied to a booking and/or client via direct FKs.
-- V1: no polymorphic linked_type — direct FK relationships are simpler and queryable.
create table if not exists notes (
  id         uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id) on delete cascade,
  client_id  uuid references clients(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

-- ── Row Level Security ───────────────────────────────────────────
alter table clients      enable row level security;
alter table events       enable row level security;
alter table bookings     enable row level security;
alter table payments     enable row level security;
alter table mixes        enable row level security;
alter table site_content enable row level security;
alter table notes        enable row level security;

-- Public read: public events only
create policy "events_public_read" on events
  for select using (public = true);

-- Public read: all mixes
create policy "mixes_public_read" on mixes
  for select using (true);

-- Public read: all site_content
create policy "site_content_public_read" on site_content
  for select using (true);

-- Authenticated (admin) full access on all tables
create policy "clients_admin_all"      on clients      for all using (auth.role() = 'authenticated');
create policy "events_admin_all"       on events       for all using (auth.role() = 'authenticated');
create policy "bookings_admin_all"     on bookings     for all using (auth.role() = 'authenticated');
create policy "payments_admin_all"     on payments     for all using (auth.role() = 'authenticated');
create policy "mixes_admin_all"        on mixes        for all using (auth.role() = 'authenticated');
create policy "site_content_admin_all" on site_content for all using (auth.role() = 'authenticated');
create policy "notes_admin_all"        on notes        for all using (auth.role() = 'authenticated');

-- ── Seed: default site_content ───────────────────────────────────
insert into site_content (key, label, value) values
  ('bio',           'DJ Bio',            'Chicago-based DJ, curator, and experience architect.'),
  ('tagline',       'Hero Tagline',      'Music is the agenda.'),
  ('hero_cta',      'Hero CTA Text',     'Book Your Event'),
  ('booking_intro', 'Booking Intro',     'Ready to elevate your event? Let''s talk.')
on conflict (key) do nothing;
