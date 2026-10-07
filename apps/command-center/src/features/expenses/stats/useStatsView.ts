import { useMemo } from 'react';
import {
  categoryBreakdown,
  categoryTrend,
  limitSlices,
  monthBounds,
  monthLabel,
  periodTotals,
  subcategoryBreakdown,
  transactionsInCategory,
  yearBounds,
  yearOfMonth,
} from '@/lib/domain/expenses';
import { useLedger } from '../hooks/useLedger';
import { useExpenseUi } from '../state/expenseUi';

/** Most slices a pie shows; the rest fold into "Other". */
const PIE_SLICES = 10;

/** Stats for the selected kind (income or expenses), period and account, plus the drill-down. */
export function useStatsView() {
  const { transactions, categories } = useLedger();
  const month = useExpenseUi((state) => state.month);
  const kind = useExpenseUi((state) => state.statsKind);
  const period = useExpenseUi((state) => state.statsPeriod);
  const accountId = useExpenseUi((state) => state.accountId);
  const drillId = useExpenseUi((state) => state.drillCategoryId);
  return useMemo(() => {
    const year = yearOfMonth(month);
    const range = period === 'year' ? yearBounds(year) : monthBounds(month);
    const totals = periodTotals(transactions, range, accountId);
    const ranked = categoryBreakdown(transactions, categories, kind, range, accountId);
    const drill =
      categories.find((category) => category.id === drillId && category.kind === kind) ?? null;
    return {
      kind,
      period,
      range,
      totals,
      total: kind === 'income' ? totals.income : totals.expense,
      periodLabel: period === 'year' ? String(year) : monthLabel(month),
      ranked,
      pie: limitSlices(ranked, PIE_SLICES),
      drill,
      drillTotal: drill ? (ranked.find((slice) => slice.id === drill.id)?.amount ?? 0) : 0,
      subSlices: drill
        ? subcategoryBreakdown(transactions, categories, drill.id, range, accountId)
        : [],
      entries: drill
        ? transactionsInCategory(transactions, categories, drill.id, range, accountId)
        : [],
      trend: drill
        ? period === 'year'
          ? categoryTrend(transactions, categories, drill.id, `${year}-12`, 12, accountId)
          : categoryTrend(transactions, categories, drill.id, month, 6, accountId)
        : [],
    };
  }, [transactions, categories, month, kind, period, accountId, drillId]);
}

export type StatsView = ReturnType<typeof useStatsView>;
