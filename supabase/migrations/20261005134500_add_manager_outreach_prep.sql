-- Add outreach/application preparation fields to Manager opportunities.

do $$
begin
  if to_regclass('public.manager_opportunities') is null then
    raise exception 'Required table public.manager_opportunities is missing';
  end if;
end
$$;

alter table public.manager_opportunities
  add column outreach_channel text
    check (outreach_channel is null or outreach_channel in ('email','instagram_dm','application','web_form','phone','other')),
  add column outreach_subject text,
  add column outreach_draft text,
  add column outreach_assets jsonb not null default '[]'::jsonb,
  add column outreach_missing_items text[] not null default '{}'::text[],
  add column outreach_prepared_at timestamptz,
  add column outreach_version text;

comment on column public.manager_opportunities.outreach_channel is
  'Recommended review-only outreach/application channel.';
comment on column public.manager_opportunities.outreach_draft is
  'Prepared outreach/application copy. Nothing is sent automatically.';
comment on column public.manager_opportunities.outreach_assets is
  'Recommended website, social, press-kit, and mix links to include with outreach.';
comment on column public.manager_opportunities.outreach_missing_items is
  'Known missing information or assets that should be resolved before outreach.';
