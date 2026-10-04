-- Store deterministic Manager fit-score details.

do $$
begin
  if to_regclass('public.manager_opportunities') is null then
    raise exception 'Required table public.manager_opportunities is missing';
  end if;
end
$$;

alter table public.manager_opportunities
  add column fit_score_breakdown jsonb not null default '{}'::jsonb,
  add column fit_score_version text,
  add column fit_scored_at timestamptz;

comment on column public.manager_opportunities.fit_score_breakdown is
  'Deterministic component scores and notes used to explain fit_score.';

comment on column public.manager_opportunities.fit_score_version is
  'Version of the deterministic Manager scoring rules used for fit_score.';
