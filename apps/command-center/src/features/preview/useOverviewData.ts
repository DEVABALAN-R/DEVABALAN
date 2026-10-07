import { useMemo } from 'react';
import { portfolioTotals, sampleValueSeries } from './sampleInvestments';
import {
  sampleAccounts,
  sampleMonthlyBudget,
  sampleMonthlyFlow,
  sampleTransactions,
} from './sampleExpenses';
import { sampleStocks, stockPortfolio } from './sampleStocks';

// See ./notice.ts — aggregates over design-preview sample data only.

const percentChange = (current: number, previous: number) =>
  previous ? ((current - previous) / previous) * 100 : 0;

export function useOverviewData() {
  return useMemo(() => {
    const today = new Date();
    const transactions = sampleTransactions(today);
    const flow = sampleMonthlyFlow(today);
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const prorate = today.getDate() / daysInMonth;
    const previous = flow[flow.length - 2];
    const income = transactions
      .filter((row) => row.kind === 'income')
      .reduce((sum, row) => sum + row.amount, 0);
    const expense = transactions
      .filter((row) => row.kind === 'expense')
      .reduce((sum, row) => sum + row.amount, 0);
    const funds = portfolioTotals();
    const stocks = stockPortfolio();
    const cash = sampleAccounts.reduce((sum, account) => sum + account.balance, 0);
    const netWorth = cash + funds.value + stocks.value;
    const savings = income - expense;
    const byCategory = new Map<string, number>();
    for (const row of transactions) {
      if (row.kind === 'expense')
        byCategory.set(row.categoryId, (byCategory.get(row.categoryId) ?? 0) + row.amount);
    }
    return {
      transactions,
      flow,
      income,
      expense,
      savings,
      invested: funds.sip,
      netWorth,
      netWorthDelta: percentChange(netWorth, netWorth - savings),
      incomeDelta: percentChange(income, previous.income),
      expenseDelta: percentChange(expense, previous.expense * prorate),
      budget: sampleMonthlyBudget,
      topCategories: [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3),
      funds: { ...funds, series: sampleValueSeries(today).value },
      stocks: {
        ...stocks,
        series: sampleStocks[0].history.map((_, index) =>
          sampleStocks.reduce((sum, stock) => sum + stock.history[index] * stock.quantity, 0),
        ),
      },
    };
  }, []);
}

export type OverviewData = ReturnType<typeof useOverviewData>;
