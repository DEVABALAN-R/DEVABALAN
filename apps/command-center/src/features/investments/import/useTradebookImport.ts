import { useCallback, useState } from 'react';
import { usePortfolioStore } from '@/features/investments/state/portfolioStore';
import {
  buildAdditions,
  mergeTradebooks,
  planImport,
  type HoldingPlan,
} from '@/lib/domain/investments';
import { newId } from '@/lib/ids';
import { pickFiles } from './pickFiles';
import { readTradebookFile } from './readFile';

export type ImportPhase = 'choose' | 'reading' | 'review';

const portfolioNow = () => {
  const { funds, fundTxns, sips, stocks, trades } = usePortfolioStore.getState();
  return { funds, fundTxns, sips, stocks, trades };
};

/**
 * Choose tradebooks → review what would change → approve. Nothing reaches the portfolio
 * (or the cloud) until `approve`, and then only the holdings left switched on.
 */
export function useTradebookImport() {
  const [phase, setPhase] = useState<ImportPhase>('choose');
  const [files, setFiles] = useState<string[]>([]);
  const [plans, setPlans] = useState<HoldingPlan[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [approved, setApproved] = useState<Set<string>>(new Set());

  const choose = useCallback(async () => {
    const picked = await pickFiles();
    if (!picked?.length) return;
    setPhase('reading');
    const merged = mergeTradebooks(await Promise.all(picked.map(readTradebookFile)));
    const next = planImport(merged.trades, portfolioNow());
    setFiles(picked.map((file) => file.name));
    setPlans(next);
    setProblems(merged.problems);
    setApproved(new Set(next.filter((plan) => plan.add.length).map((plan) => plan.key)));
    setPhase('review');
  }, []);

  const toggle = useCallback((key: string, on: boolean) => {
    setApproved((previous) => {
      const next = new Set(previous);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setPhase('choose');
    setFiles([]);
    setPlans([]);
    setProblems([]);
    setApproved(new Set());
  }, []);

  /** Adds the approved trades; returns how many trades and holdings were added. */
  const approve = useCallback(() => {
    const additions = buildAdditions(plans, approved, portfolioNow(), newId);
    usePortfolioStore.getState().importPortfolio(additions);
    const holdings = plans.filter((plan) => approved.has(plan.key) && plan.add.length).length;
    return { trades: additions.fundTxns.length + additions.trades.length, holdings };
  }, [plans, approved]);

  const chosen = plans.filter((plan) => approved.has(plan.key));
  return {
    phase,
    files,
    plans,
    problems,
    approved,
    tradeCount: chosen.reduce((sum, plan) => sum + plan.add.length, 0),
    choose,
    toggle,
    reset,
    approve,
  };
}
