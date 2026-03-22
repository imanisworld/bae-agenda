-- ============================================================
-- Portfolio Entries — add status, state, updated_at columns
-- ============================================================

alter table portfolio_entries
  add column if not exists status text not null default 'published'
    check (status in ('published', 'draft')),
  add column if not exists state text,
  add column if not exists updated_at timestamptz default now();

-- Back-fill updated_at from created_at for existing rows
update portfolio_entries
  set updated_at = created_at
  where updated_at is null;

-- Auto-update updated_at on every edit
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_portfolio_entries_updated_at
  before update on portfolio_entries
  for each row execute function update_updated_at_column();

-- Narrow the public read policy to published entries only
drop policy if exists "Public can read portfolio entries" on portfolio_entries;

create policy "Public can read published portfolio entries"
  on portfolio_entries for select
  using (status = 'published');
