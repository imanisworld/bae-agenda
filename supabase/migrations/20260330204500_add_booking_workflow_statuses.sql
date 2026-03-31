alter table bookings
  add column if not exists lifecycle_status text not null default 'new'
    check (lifecycle_status in ('new', 'contacted', 'negotiating', 'confirmed', 'completed', 'lost')),
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'deposit_requested', 'deposit_paid', 'balance_requested', 'paid')),
  add column if not exists balance_paid_at timestamptz,
  add column if not exists payment_method text;

update bookings
set lifecycle_status = case
  when status = 'confirmed' then 'confirmed'
  when status = 'completed' then 'completed'
  when status = 'cancelled' then 'lost'
  else 'new'
end
where lifecycle_status is null
   or lifecycle_status = 'new';

with payment_rollup as (
  select
    b.id,
    coalesce(b.quote, 0) as quote,
    coalesce(b.deposit_amount, 0) as deposit_amount,
    b.lifecycle_status,
    coalesce(
      sum(case when p.status = 'received' then p.amount else 0 end),
      0
    ) as received_total,
    coalesce(
      sum(case when p.status = 'received' and p.type in ('deposit', 'full') then p.amount else 0 end),
      0
    ) as received_deposit_total
  from bookings b
  left join payments p on p.booking_id = b.id
  group by b.id, b.quote, b.deposit_amount, b.lifecycle_status
)
update bookings b
set payment_status = case
  when r.quote > 0 and r.received_total >= r.quote then 'paid'
  when r.deposit_amount > 0 and r.received_deposit_total >= r.deposit_amount then 'deposit_paid'
  when r.lifecycle_status = 'confirmed' and r.deposit_amount > 0 then 'deposit_requested'
  else 'unpaid'
end,
balance_paid_at = case
  when r.quote > 0 and r.received_total >= r.quote then coalesce(b.balance_paid_at, now())
  else b.balance_paid_at
end
from payment_rollup r
where b.id = r.id;
