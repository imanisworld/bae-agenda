create table if not exists email_delivery_events (
  event_id text primary key,
  email_id text not null,
  event_type text not null,
  recipient text,
  subject text,
  occurred_at timestamptz not null,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create index if not exists email_delivery_events_email_id_idx
  on email_delivery_events(email_id);

create index if not exists email_delivery_events_recipient_idx
  on email_delivery_events(recipient);

create index if not exists email_delivery_events_occurred_at_idx
  on email_delivery_events(occurred_at desc);

alter table email_delivery_events enable row level security;

-- No client policies on purpose. This table contains provider delivery metadata and is
-- written/read only through server-side service-role code.
