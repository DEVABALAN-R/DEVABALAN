-- Add authenticated, per-user mutual fund data to the private workspace.
-- Run this migration in the Supabase SQL editor before deploying the updated app.

alter table public.user_workspaces
  add column if not exists mutual_funds jsonb not null default '[]'::jsonb
    check (jsonb_typeof(mutual_funds) = 'array'),
  add column if not exists fund_purchases jsonb not null default '[]'::jsonb
    check (jsonb_typeof(fund_purchases) = 'array');

-- Keep the existing four-argument RPC during rollout so older app clients can
-- continue saving their finance data while the new app calls the six-argument RPC.
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
