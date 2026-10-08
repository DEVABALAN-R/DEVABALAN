-- Rollback for 202610080006_ledger_sync.sql: removes the two RPCs. Table data is untouched.
drop function if exists public.sync_ledger(jsonb);
drop function if exists public.load_ledger();
