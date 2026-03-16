-- ============================================================
-- EXPAND PAYMENT METHOD CHECK CONSTRAINT
-- Purpose:
-- Keep the database in sync with the app-level payment method
-- constants/types by allowing ACH and check payments.
-- Safe to run multiple times.
-- ============================================================

do $$
begin
  alter table payments
    drop constraint if exists payments_method_check;

  alter table payments
    add constraint payments_method_check
    check (method in ('cash', 'venmo', 'zelle', 'stripe', 'check', 'ach', 'other'));
end
$$;
