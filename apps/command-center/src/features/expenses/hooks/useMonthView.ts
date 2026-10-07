import { useMemo } from 'react';
import {
  accountBalance,
  balanceSummary,
  calendarMonth,
  comparisonRange,
  groupByDay,
  monthBounds,
  monthLabel,
  monthOf,
  percentChange,
  periodTotals,
  todayIso,
  type DateRange,
} from '@/lib/domain/expenses';
import { useExpenseUi } from '../state/expenseUi';
import { useLedger } from './useLedger';

/** "vs 1–7 Sep" while a month is in progress, "vs Sep" once it is over. */
function comparisonLabel(base: DateRange, month: string, today: string): string {
  const name = monthLabel(monthOf(base.start), 'short');
  if (monthOf(today) !== month) return `vs ${name}`;
  return `vs ${Number(base.start.slice(8))}–${Number(base.end.slice(8))} ${name}`;
}

/** Everything the Transactions views need for the selected month and account filter. */
export function useMonthView() {
  const { accounts, transactions } = useLedger();
  const month = useExpenseUi((state) => state.month);
  const accountId = useExpenseUi((state) => state.accountId);
  const selectedDate = useExpenseUi((state) => state.selectedDate);
  return useMemo(() => {
    const today = todayIso();
    const range = monthBounds(month);
    const totals = periodTotals(transactions, range, accountId);
    const base = comparisonRange(month, today);
    const previous = periodTotals(transactions, base, accountId);
    const account = accounts.find((item) => item.id === accountId) ?? null;
    const groups = groupByDay(transactions, range, accountId);
    const focusDay =
      selectedDate && monthOf(selectedDate) === month
        ? selectedDate
        : monthOf(today) === month
          ? today
          : (groups[0]?.date ?? range.start);
    return {
      month,
      range,
      today,
      accountId,
      account,
      totals,
      groups,
      focusDay,
      weeks: calendarMonth(month, transactions, accountId),
      balance: account
        ? accountBalance(account, transactions, range.end)
        : balanceSummary(accounts, transactions, range.end).total,
      comparison: comparisonLabel(base, month, today),
      deltas: {
        income: percentChange(totals.income, previous.income),
        expense: percentChange(totals.expense, previous.expense),
      },
    };
  }, [accounts, transactions, month, accountId, selectedDate]);
}
