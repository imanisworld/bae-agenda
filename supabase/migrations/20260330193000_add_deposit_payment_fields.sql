alter table bookings
  add column if not exists deposit_status text not null default 'unpaid'
    check (deposit_status in ('unpaid', 'pending', 'paid')),
  add column if not exists deposit_paid_at timestamptz,
  add column if not exists deposit_confirmed_via text
    check (deposit_confirmed_via in ('stripe', 'manual')),
  add column if not exists deposit_checkout_session_id text;

alter table payments
  add column if not exists external_reference text;

do $$
begin
  alter table payments
    drop constraint if exists payments_method_check;

  alter table payments
    add constraint payments_method_check
      check (method in ('cash', 'venmo', 'zelle', 'cash_app', 'stripe', 'check', 'ach', 'other'));
exception
  when undefined_table then null;
end $$;

create unique index if not exists payments_external_reference_key
  on payments (external_reference)
  where external_reference is not null;
