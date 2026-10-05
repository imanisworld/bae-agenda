-- Some clients only give a name. Email stays unique when present;
-- Postgres allows any number of NULLs under a unique constraint.
alter table public.clients alter column email drop not null;
