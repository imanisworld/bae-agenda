-- Manager opportunity activity timeline.
-- Additive only. Private server-managed history for Manager opportunities.

do $$
begin
  if to_regclass('public.manager_opportunity_activities') is not null then
    raise exception 'Table public.manager_opportunity_activities already exists; stop and inspect';
  end if;

  if to_regclass('public.manager_opportunities') is null then
    raise exception 'Required table public.manager_opportunities is missing';
  end if;
end
$$;

create table public.manager_opportunity_activities (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.manager_opportunities(id) on delete cascade,
  activity_type text not null default 'note'
    check (activity_type in (
      'created',
      'research',
      'note',
      'application',
      'contact',
      'follow_up',
      'response',
      'negotiation',
      'status_change',
      'booking',
      'other'
    )),
  title text not null,
  body text,
  occurred_at timestamptz not null default now(),
  from_status text,
  to_status text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.manager_opportunity_activities enable row level security;

revoke all on table public.manager_opportunity_activities from public, anon, authenticated;
grant select, insert, update, delete on table public.manager_opportunity_activities to service_role;

create index manager_opportunity_activities_opportunity_time_idx
  on public.manager_opportunity_activities (opportunity_id, occurred_at desc, created_at desc);

create index manager_opportunity_activities_type_idx
  on public.manager_opportunity_activities (activity_type, occurred_at desc);

comment on table public.manager_opportunity_activities is
  'Private Manager timeline for outreach, applications, responses, negotiations, notes, status changes, and booking conversion.';

insert into public.manager_opportunity_activities (
  opportunity_id,
  activity_type,
  title,
  body,
  occurred_at,
  metadata
)
select
  id,
  'created',
  'Opportunity added to Manager',
  coalesce(source_reference, 'Initial Manager opportunity record.'),
  created_at,
  jsonb_build_object('source_type', source_type, 'initial_status', status)
from public.manager_opportunities;
