alter table invoices
  add column if not exists due_date date,
  add column if not exists payment_terms text not null
    default 'Balance due on or before the event date. Deposit is non-refundable. Final balance must be paid before the event.',
  add column if not exists line_items jsonb not null default '[]'::jsonb;

alter table invoices
  drop constraint if exists invoices_line_items_array;

alter table invoices
  add constraint invoices_line_items_array
  check (jsonb_typeof(line_items) = 'array');

update invoices i
set due_date = (b.event_date at time zone coalesce(nullif(b.event_timezone, ''), 'UTC'))::date
from bookings b
where b.id = i.booking_id
  and i.due_date is null;

update invoices
set line_items = jsonb_build_array(
  jsonb_build_object(
    'description', coalesce(nullif(event_name, ''), 'DJ Services'),
    'quantity', 1,
    'unit_amount', total_amount
  )
)
where jsonb_array_length(line_items) = 0
  and total_amount > 0;
