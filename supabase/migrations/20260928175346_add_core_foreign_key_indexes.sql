create index if not exists bookings_client_id_idx
  on public.bookings (client_id);

create index if not exists notes_booking_id_idx
  on public.notes (booking_id);

create index if not exists notes_client_id_idx
  on public.notes (client_id);

create index if not exists payments_booking_id_idx
  on public.payments (booking_id);
