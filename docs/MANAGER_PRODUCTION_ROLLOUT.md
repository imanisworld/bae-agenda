# Manager Production Rollout

Production migration history does not fully match the repository migration folder, so this rollout uses one exact reviewed migration rather than a blanket database push.

## Preflight

Confirm against the live Supabase project:

- `public.manager_profiles` does not exist.
- `public.manager_opportunities` does not exist.
- `public.bookings(id)` exists.
- `public.touch_updated_at()` exists.
- existing booking/client/payment/event/invoice/media orphan checks are zero.
- the production Vercel deployment is READY.
- current production logs do not show a new database failure relevant to this rollout.

## Apply

Apply only `20261004220000_create_manager_foundation.sql`.

## Expected effects

- two new Manager tables
- one Manager profile seeded with identity/contact facts only
- no existing booking, client, invoice, payment, or event rows changed
- no anon/authenticated access to Manager tables
- service-role CRUD access only
- two updated-at triggers and five indexes

## Postflight

- confirm both Manager tables exist with RLS enabled
- confirm anon/authenticated have no privileges on them
- confirm the seeded profile exists exactly once
- confirm opportunities row count is zero
- confirm existing core row counts are unchanged
- rerun FK orphan checks
- rerun Supabase security/performance advisors
- verify admin Manager pages and current Vercel runtime logs

## Rollback

Before any real Manager data is entered, rollback is simply:

```sql
drop table if exists public.manager_opportunities;
drop table if exists public.manager_profiles;
```

After real Manager data exists, export/preserve it before considering rollback.
