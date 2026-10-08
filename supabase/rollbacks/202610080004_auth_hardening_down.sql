-- Rollback for 202610080004_auth_hardening.sql. Run only if 0004 must be undone.
-- First remove the hook in Dashboard → Authentication → Hooks, or sign-ups will fail
-- because the hook function no longer exists.
--
-- This drops profiles, user_preferences and audit_logs WITH THEIR DATA. Export
-- audit_logs first if the history matters. Workspace and portfolio data are untouched.

-- RPCs: restore the definitions from 0002 and 0003 (including the four-argument overload).
create or replace function public.save_user_workspace(
  p_expected_revision bigint,
  p_transactions jsonb,
  p_accounts jsonb,
  p_categories jsonb
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_revision bigint;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if jsonb_typeof(p_transactions) <> 'array'
    or jsonb_typeof(p_accounts) <> 'array'
    or jsonb_typeof(p_categories) <> 'array' then
    raise exception 'Workspace collections must be JSON arrays';
  end if;

  update public.user_workspaces
    set transactions = p_transactions,
        accounts = p_accounts,
        categories = p_categories,
        revision = revision + 1,
        updated_at = now()
    where user_id = v_user_id and revision = p_expected_revision
    returning revision into v_revision;

  if v_revision is not null then
    return v_revision;
  end if;

  if p_expected_revision = 0 then
    insert into public.user_workspaces (user_id, transactions, accounts, categories, revision, updated_at)
      values (v_user_id, p_transactions, p_accounts, p_categories, 1, now())
      on conflict (user_id) do nothing
      returning revision into v_revision;
  end if;

  return v_revision;
end;
$$;
revoke all on function public.save_user_workspace(bigint, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_user_workspace(bigint, jsonb, jsonb, jsonb) to authenticated;

create or replace function public.save_user_workspace(
  p_expected_revision bigint,
  p_transactions jsonb,
  p_accounts jsonb,
  p_categories jsonb,
  p_mutual_funds jsonb,
  p_fund_purchases jsonb
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_revision bigint;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if jsonb_typeof(p_transactions) is distinct from 'array'
    or jsonb_typeof(p_accounts) is distinct from 'array'
    or jsonb_typeof(p_categories) is distinct from 'array'
    or jsonb_typeof(p_mutual_funds) is distinct from 'array'
    or jsonb_typeof(p_fund_purchases) is distinct from 'array' then
    raise exception 'Workspace collections must be JSON arrays';
  end if;

  update public.user_workspaces
    set transactions = p_transactions,
        accounts = p_accounts,
        categories = p_categories,
        mutual_funds = p_mutual_funds,
        fund_purchases = p_fund_purchases,
        revision = revision + 1,
        updated_at = now()
    where user_id = v_user_id and revision = p_expected_revision
    returning revision into v_revision;

  if v_revision is not null then return v_revision; end if;

  if p_expected_revision = 0 then
    insert into public.user_workspaces (
      user_id, transactions, accounts, categories, mutual_funds, fund_purchases, revision, updated_at
    ) values (
      v_user_id, p_transactions, p_accounts, p_categories, p_mutual_funds, p_fund_purchases, 1, now()
    ) on conflict (user_id) do nothing
    returning revision into v_revision;
  end if;

  return v_revision;
end;
$$;
revoke all on function public.save_user_workspace(bigint, jsonb, jsonb, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_user_workspace(bigint, jsonb, jsonb, jsonb, jsonb, jsonb) to authenticated;

create or replace function public.save_public_portfolio(
  p_expected_revision bigint,
  p_slug text,
  p_profile jsonb
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_revision bigint;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if jsonb_typeof(p_profile) <> 'object' then
    raise exception 'Portfolio profile must be a JSON object';
  end if;
  if p_slug is null or p_slug !~ '^[a-z0-9][a-z0-9-]{1,48}$' then
    raise exception 'Invalid public portfolio slug';
  end if;

  update public.public_portfolios
    set slug = p_slug,
        profile = p_profile,
        is_published = true,
        revision = revision + 1,
        updated_at = now()
    where user_id = v_user_id and revision = p_expected_revision
    returning revision into v_revision;

  if v_revision is not null then
    return v_revision;
  end if;

  if p_expected_revision = 0 then
    insert into public.public_portfolios (user_id, slug, profile, is_published, revision, updated_at)
      values (v_user_id, p_slug, p_profile, true, 1, now())
      on conflict (user_id) do nothing
      returning revision into v_revision;
  end if;

  return v_revision;
end;
$$;
revoke all on function public.save_public_portfolio(bigint, text, jsonb) from public, anon;
grant execute on function public.save_public_portfolio(bigint, text, jsonb) to authenticated;

-- New objects from 0004.
drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.audit_logs;
drop table if exists public.user_preferences;
drop table if exists public.profiles;
drop schema if exists internal cascade;
