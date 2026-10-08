-- Rollback for 202610080005_core_finance.sql. Drops the finance and notes tables
-- WITH THEIR DATA: export them first. The legacy user_workspaces data and everything
-- from 0004 (profiles, preferences, audit_logs, allowlist) are not touched; audit
-- entries already written stay.
drop table if exists public.repayment_settles;
drop table if exists public.transaction_splits;
drop table if exists public.transactions;
drop table if exists public.people;
drop table if exists public.categories;
drop table if exists public.accounts;
drop table if exists public.notes;

drop function if exists internal.check_splits();
drop function if exists internal.check_transaction_category();
drop function if exists internal.check_category_parent();
drop function if exists internal.valid_checklist(jsonb);
drop function if exists internal.valid_labels(text[]);
drop function if exists internal.secure_user_table(text, boolean);
drop function if exists internal.audit_row();
drop function if exists internal.keep_user_id();
drop function if exists internal.session_meets_mfa();
revoke usage on schema internal from authenticated;
