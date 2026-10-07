-- Durable ledger for each DJ Manager discovery pass.
-- Additive only. The discovery automation writes one row per run so the UI
-- reports observed work instead of reconstructing a run from timestamps.

do $$
begin
  if to_regclass('public.manager_discovery_runs') is not null then
    raise exception 'Table public.manager_discovery_runs already exists; stop and inspect';
  end if;
end
$$;

create table public.manager_discovery_runs (
  id uuid primary key default gen_random_uuid(),
  run_key text not null unique,
  status text not null default 'running'
    check (status in ('running', 'completed', 'partial', 'failed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  sources_due integer not null default 0 check (sources_due >= 0),
  sources_checked integer not null default 0 check (sources_checked >= 0),
  partial_coverage_count integer not null default 0 check (partial_coverage_count >= 0),
  signals_created integer not null default 0 check (signals_created >= 0),
  signals_ignored integer not null default 0 check (signals_ignored >= 0),
  opportunities_created integer not null default 0 check (opportunities_created >= 0),
  warm_rebooks_created integer not null default 0 check (warm_rebooks_created >= 0),
  warm_rebooks_updated integer not null default 0 check (warm_rebooks_updated >= 0),
  sources_added integer not null default 0 check (sources_added >= 0),
  summary jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (completed_at is null or completed_at >= started_at)
);

alter table public.manager_discovery_runs enable row level security;

revoke all on table public.manager_discovery_runs from public, anon, authenticated;
grant select, insert, update, delete on table public.manager_discovery_runs to service_role;

create index manager_discovery_runs_started_idx
  on public.manager_discovery_runs (started_at desc);

create index manager_discovery_runs_status_idx
  on public.manager_discovery_runs (status, started_at desc);

comment on table public.manager_discovery_runs is
  'Private per-run ledger for DJ Manager source checks, discovery results, warm rebooks, and coverage.';
