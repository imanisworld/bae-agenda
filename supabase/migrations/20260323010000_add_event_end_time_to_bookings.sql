-- Add end time to bookings so clients can specify when the event wraps
alter table bookings
  add column if not exists event_end_time timestamptz;
