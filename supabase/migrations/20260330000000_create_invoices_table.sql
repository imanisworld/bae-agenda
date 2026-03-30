create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete cascade,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'paid', 'void')),
  invoice_number text not null,
  pdf_filename text not null,
  event_name text,
  client_name text,
  client_email text,
  total_amount numeric(10, 2) not null default 0,
  deposit_amount numeric(10, 2) not null default 0,
  balance_due numeric(10, 2) not null default 0,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id)
);

create or replace trigger invoices_updated_at
  before update on invoices
  for each row execute function touch_updated_at();

alter table invoices enable row level security;

drop policy if exists "invoices_admin_all" on invoices;
create policy "invoices_admin_all" on invoices
  for all using (auth.role() = 'authenticated');
