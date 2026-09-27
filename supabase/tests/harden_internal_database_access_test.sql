BEGIN;
SELECT plan(27);

SELECT has_schema('private', 'admin helper lives outside the exposed public schema');
SELECT has_function('private', 'is_admin_user', 'private admin helper exists');
SELECT hasnt_function('public', 'is_admin_user', 'public admin RPC is removed');

SELECT ok(
  NOT has_function_privilege('anon', 'private.is_admin_user()', 'EXECUTE'),
  'anon cannot execute the admin helper'
);
SELECT ok(
  has_function_privilege('authenticated', 'private.is_admin_user()', 'EXECUTE'),
  'authenticated can execute the admin helper for RLS policies'
);

SELECT ok(
  (
    SELECT c.relrowsecurity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'booking_activity'
  ),
  'booking_activity has RLS enabled'
);
SELECT ok(
  NOT has_table_privilege('anon', 'public.booking_activity', 'INSERT'),
  'anon cannot insert booking_activity'
);
SELECT ok(
  NOT has_table_privilege('anon', 'public.booking_activity', 'SELECT'),
  'anon cannot select booking_activity'
);
SELECT ok(
  NOT has_table_privilege('authenticated', 'public.booking_activity', 'INSERT'),
  'authenticated cannot insert booking_activity'
);
SELECT ok(
  NOT has_table_privilege('authenticated', 'public.booking_activity', 'SELECT'),
  'authenticated cannot select booking_activity'
);
SELECT ok(
  has_table_privilege('service_role', 'public.booking_activity', 'INSERT'),
  'service_role can insert booking_activity'
);

SELECT ok(
  NOT has_table_privilege('anon', 'public.admin_users', 'SELECT'),
  'anon cannot read internal admin_users'
);
SELECT ok(
  NOT has_table_privilege('authenticated', 'public.email_delivery_events', 'INSERT'),
  'authenticated cannot write internal email_delivery_events'
);

SELECT ok(
  (
    SELECT p.proconfig @> ARRAY['search_path=""'] OR p.proconfig @> ARRAY['search_path=']
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'touch_updated_at'
  ),
  'touch_updated_at has an empty search_path'
);
SELECT ok(
  (
    SELECT p.proconfig @> ARRAY['search_path=""'] OR p.proconfig @> ARRAY['search_path=']
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
  ),
  'update_updated_at_column has an empty search_path'
);
SELECT ok(
  (
    SELECT p.proconfig @> ARRAY['search_path=""'] OR p.proconfig @> ARRAY['search_path=']
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'private' AND p.proname = 'is_admin_user'
  ),
  'private.is_admin_user has an empty search_path'
);

INSERT INTO public.events (title, slug, event_date, "public")
VALUES ('Hardening Public Night', 'hardening-public-night', now(), true);

INSERT INTO public.events (title, slug, event_date, "public")
VALUES ('Hardening Private Night', 'hardening-private-night', now(), false);

CREATE FUNCTION pg_temp.anon_event_count(target_slug text)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  n integer;
BEGIN
  SET LOCAL ROLE anon;
  SELECT count(*)::integer INTO n FROM public.events WHERE slug = target_slug;
  RETURN n;
END;
$$;

SELECT is(
  pg_temp.anon_event_count('hardening-public-night'),
  1,
  'anon can still read public events'
);
RESET ROLE;
SELECT is(
  pg_temp.anon_event_count('hardening-private-night'),
  0,
  'anon cannot read private events'
);
RESET ROLE;
SELECT throws_ok(
  $$SELECT public.is_admin_user()$$,
  '42883',
  'function public.is_admin_user() does not exist',
  'anon cannot call the removed public admin RPC'
);

INSERT INTO public.bookings (event_name, event_date, notes)
VALUES ('Hardening Booking', now(), 'before');

UPDATE public.bookings
SET updated_at = timestamptz '1999-01-01', notes = 'after'
WHERE event_name = 'Hardening Booking';

SELECT cmp_ok(
  (SELECT updated_at FROM public.bookings WHERE event_name = 'Hardening Booking'),
  '>',
  timestamptz '2000-01-01',
  'touch_updated_at still replaces updated_at'
);

INSERT INTO public.portfolio_entries (event_name, city, year, status)
VALUES ('Hardening Portfolio', 'Indianapolis, IN', 2026, 'published');

UPDATE public.portfolio_entries
SET updated_at = timestamptz '1999-01-01', notes = 'after'
WHERE event_name = 'Hardening Portfolio';

SELECT cmp_ok(
  (SELECT updated_at FROM public.portfolio_entries WHERE event_name = 'Hardening Portfolio'),
  '>',
  timestamptz '2000-01-01',
  'update_updated_at_column still replaces updated_at'
);

INSERT INTO public.admin_users (email, active)
VALUES ('admin@example.com', true);

CREATE FUNCTION pg_temp.insert_client_as(claims text, client_email text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', claims, true);
  SET LOCAL ROLE authenticated;
  EXECUTE format(
    'INSERT INTO public.clients (first_name, email) VALUES (%L, %L)',
    'Role Check',
    client_email
  );
END;
$$;

SELECT throws_ok(
  $$SELECT pg_temp.insert_client_as(
    '{"sub":"11111111-1111-1111-1111-111111111111","email":"other@example.com","role":"authenticated"}',
    'other-client@example.com'
  )$$,
  '42501',
  'new row violates row-level security policy for table "clients"',
  'authenticated non-admin is denied when the allowlist is populated'
);
RESET ROLE;
SELECT lives_ok(
  $$SELECT pg_temp.insert_client_as(
    '{"sub":"22222222-2222-2222-2222-222222222222","email":"admin@example.com","role":"authenticated"}',
    'admin-client@example.com'
  )$$,
  'allowlisted authenticated admin can write clients'
);
RESET ROLE;

DELETE FROM public.admin_users;

SELECT lives_ok(
  $$SELECT pg_temp.insert_client_as(
    '{"sub":"33333333-3333-3333-3333-333333333333","email":"fallback@example.com","role":"authenticated"}',
    'fallback-client@example.com'
  )$$,
  'empty allowlist permits an authenticated user'
);
RESET ROLE;
CREATE FUNCTION pg_temp.insert_client_as_anon()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  SET LOCAL ROLE anon;
  INSERT INTO public.clients (first_name, email) VALUES ('Anon', 'anon-client@example.com');
END;
$$;

SELECT throws_ok(
  $$SELECT pg_temp.insert_client_as_anon()$$,
  '42501',
  'new row violates row-level security policy for table "clients"',
  'empty allowlist still denies anon'
);
RESET ROLE;

INSERT INTO public.bookings (event_name, event_date)
VALUES ('Activity Booking', now());

CREATE FUNCTION pg_temp.insert_activity_as(role_name text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('SET LOCAL ROLE %I', role_name);
  INSERT INTO public.booking_activity (booking_id, type, description)
  SELECT id, 'booking_created', role_name
  FROM public.bookings
  WHERE event_name = 'Activity Booking';
END;
$$;

SELECT lives_ok(
  $$SELECT pg_temp.insert_activity_as('service_role')$$,
  'service_role can insert booking_activity'
);
RESET ROLE;
SELECT throws_ok(
  $$SELECT pg_temp.insert_activity_as('anon')$$,
  '42501',
  'permission denied for table booking_activity',
  'anon cannot insert booking_activity'
);
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
