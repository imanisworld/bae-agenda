-- Add deterministic gig-economics fields to Manager opportunities.

do $$
begin
  if to_regclass('public.manager_opportunities') is null then
    raise exception 'Required table public.manager_opportunities is missing';
  end if;
end
$$;

alter table public.manager_opportunities
  add column expected_work_hours numeric(6,2)
    check (expected_work_hours is null or expected_work_hours > 0),
  add column estimated_total_hours numeric(6,2)
    check (estimated_total_hours is null or estimated_total_hours > 0),
  add column estimated_net_pay numeric(10,2)
    check (estimated_net_pay is null or estimated_net_pay >= 0),
  add column effective_hourly_rate numeric(10,2)
    check (effective_hourly_rate is null or effective_hourly_rate >= 0),
  add column economics_basis text not null default 'unknown'
    check (economics_basis in ('unknown','on_site_gross','all_in_gross','all_in_net')),
  add column economics_breakdown jsonb not null default '{}'::jsonb;

comment on column public.manager_opportunities.expected_work_hours is
  'Expected required work hours excluding travel, including setup/performance/teardown when known.';

comment on column public.manager_opportunities.estimated_total_hours is
  'Expected work hours plus round-trip travel time when one-way travel_minutes is known.';

comment on column public.manager_opportunities.estimated_net_pay is
  'Guaranteed minimum pay after known out-of-pocket travel cost; null when travel cost is unknown.';

comment on column public.manager_opportunities.effective_hourly_rate is
  'Deterministic hourly value using the basis recorded in economics_basis.';

comment on column public.manager_opportunities.economics_breakdown is
  'Inputs and calculation details supporting gig-economics values.';
