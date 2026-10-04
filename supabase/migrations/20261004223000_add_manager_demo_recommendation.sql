-- Add demo-mix guidance to Manager opportunities.

do $$
begin
  if to_regclass('public.manager_opportunities') is null then
    raise exception 'Required table public.manager_opportunities is missing';
  end if;
end
$$;

alter table public.manager_opportunities
  add column recommended_demo text,
  add column recommended_demo_reason text;

comment on column public.manager_opportunities.recommended_demo is
  'Short label for the demo mix best suited to this opportunity.';

comment on column public.manager_opportunities.recommended_demo_reason is
  'Manager rationale for why that demo mix matches the opportunity.';
