#!/usr/bin/env bash
# Applies every migration to a fresh database on plain Postgres (with a small stand-in
# for Supabase's auth schema and roles), runs the SQL tests, then checks that the
# latest migration rolls back and re-applies cleanly.
#
# Uses the usual PG* environment variables (PGHOST, PGPORT, PGUSER, PGPASSWORD) and
# needs a superuser. It creates and drops the database named by TEST_DB.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/.." && pwd)"
db="${TEST_DB:-devabalan_migrations_test}"
psql_db() { psql -X -q -v ON_ERROR_STOP=1 -d "$db" "$@"; }

psql -X -q -v ON_ERROR_STOP=1 -d postgres -c "drop database if exists $db" -c "create database $db"

echo "→ Supabase stand-in"
psql_db -f "$here/support/supabase_stub.sql"

echo "→ Migrations before 0004"
for file in "$root"/migrations/2026100400{01,02,03}_*.sql; do
  echo "  $(basename "$file")"
  psql_db -f "$file"
done

echo "→ Fixtures (existing accounts)"
psql_db <<'SQL'
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', ' Alice@Example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@example.com');
insert into public.user_workspaces (user_id, revision) values ('00000000-0000-0000-0000-00000000000a', 1);
insert into public.public_portfolios (user_id, slug, profile, revision)
  values ('00000000-0000-0000-0000-00000000000a', 'devabalan', '{"name":"A"}', 1);
SQL

echo "→ 0004 auth hardening"
psql_db -f "$root/migrations/202610080004_auth_hardening.sql"
echo "→ 0004 again (must be idempotent)"
psql_db -f "$root/migrations/202610080004_auth_hardening.sql"

echo "→ Tests"
psql_db -f "$here/202610080004_auth_hardening.test.sql"

echo "→ Rollback, then re-apply"
psql_db -f "$root/rollbacks/202610080004_auth_hardening_down.sql"
psql_db -c "do \$\$ begin
  if to_regprocedure('public.save_user_workspace(bigint,jsonb,jsonb,jsonb)') is null
    or to_regclass('public.profiles') is not null
    or exists (select 1 from pg_namespace where nspname = 'internal') then
    raise exception 'FAIL: rollback did not restore the previous state';
  end if;
end \$\$;"
psql_db -f "$root/migrations/202610080004_auth_hardening.sql"
psql_db -f "$here/202610080004_auth_hardening.test.sql"

psql -X -q -d postgres -c "drop database if exists $db"
echo "✓ Database migration tests passed"
