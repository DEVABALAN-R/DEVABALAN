import { useMemo } from 'react';
import {
  accountBalance,
  addMonths,
  balanceSummary,
  calendarMonth,
  groupByDay,
  monthBounds,
  monthOf,
  percentChange,
  periodTotals,
  todayIso,
} from '@/lib/domain/expenses';
import { useExpenseUi } from '../state/expenseUi';
import { useLedger } from './useLedger';

/** Everything the Transactions views need for the selected month and account filter. */
export function useMonthView() {
  const { accounts, transactions } = useLedger();
  const month = useExpenseUi((state) => state.month);
  const accountId = useExpenseUi((state) => state.accountId);
  const selectedDate = useExpenseUi((state) => state.selectedDate);
  return useMemo(() => {
    const range = monthBounds(month);
    const totals = periodTotals(transactions, range, accountId);
    const previous = periodTotals(transactions, monthBounds(addMonths(month, -1)), accountId);
    const account = accounts.find((item) => item.id === accountId);
    const balance = account
      ? accountBalance(account, transactions, range.end)
      : balanceSummary(accounts, transactions, range.end).total;
    const groups = groupByDay(transactions, range, accountId);
    const today = todayIso();
    const focusDay =
      selectedDate && monthOf(selectedDate) === month
        ? selectedDate
        : monthOf(today) === month
          ? today
          : (groups[0]?.date ?? range.start);
    return {
      month,
      range,
      totals,
      previous,
      balance,
      groups,
      weeks: calendarMonth(month, transactions, accountId),
      focusDay,
      deltas: {
        income: percentChange(totals.income, previous.income),
        expense: percentChange(totals.expense, previous.expense),
      },
    };
  }, [accounts, transactions, month, accountId, selectedDate]);
}
