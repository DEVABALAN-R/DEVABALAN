import {
  Flag,
  FileChartColumn,
  House,
  Landmark,
  Lightbulb,
  ReceiptText,
  TrendingUp,
} from '@/components/icons';
import type { ComponentProps } from 'react';
import type { PlannedScreen } from './PlannedScreen';

type PlannedConfig = ComponentProps<typeof PlannedScreen>;

/** Placeholder copy for destinations whose modules ship in later phases (see the plan, §22). */
export const plannedScreens = {
  index: {
    title: 'Dashboard',
    eyebrow: 'Command center',
    description: 'Your net worth, cash flow, investments and insights at a glance.',
    icon: House,
    phase: 4,
    upcoming: [
      'Net worth, income, expenses and savings rate with change vs last month',
      'Cash-flow and category charts with text summaries',
      'Investment summary, upcoming items and generated insights',
      'Customisable widget layout',
    ],
  },
  transactions: {
    title: 'Transactions',
    eyebrow: 'Money',
    description: 'Every expense, income, transfer and refund in one ledger.',
    icon: ReceiptText,
    phase: 5,
    upcoming: [
      'Fast quick-add with category grid',
      'Calendar and list views',
      'Search, filters and saved views',
      'Undo for edits and deletes',
    ],
  },
  accounts: {
    title: 'Accounts',
    eyebrow: 'Money',
    description: 'Bank accounts, cards, cash and wallets with correct balances.',
    icon: Landmark,
    phase: 5,
    upcoming: [
      'Balances that include card-bill transfers',
      'Bank, credit card, cash and wallet types',
      'Archive instead of delete',
    ],
  },
  investments: {
    title: 'Investments',
    eyebrow: 'Wealth',
    description: 'Mutual fund holdings, returns and allocation.',
    icon: TrendingUp,
    phase: 6,
    upcoming: [
      'Holdings with value, gain and XIRR',
      'Purchases, SIPs, redemptions and switches',
      'NAV with source and date shown',
      'Allocation by category and AMC',
    ],
  },
  goals: {
    title: 'Goals',
    eyebrow: 'Plan',
    description: 'Targets such as an emergency fund, vehicle or house.',
    icon: Flag,
    phase: 9,
    upcoming: [
      'Target, progress and expected completion',
      'Contribution history',
      'Links to accounts and holdings',
    ],
  },
  insights: {
    title: 'Insights',
    eyebrow: 'Understand',
    description: 'Changes and patterns found in your own data.',
    icon: Lightbulb,
    phase: 7,
    upcoming: [
      'Month-over-month category changes',
      'Unusual transactions',
      'Investment concentration warnings',
    ],
  },
  reports: {
    title: 'Reports',
    eyebrow: 'Understand',
    description: 'Monthly, category, investment and annual reports.',
    icon: FileChartColumn,
    phase: 7,
    upcoming: ['Date range and comparison period', 'Charts with table view', 'CSV export'],
  },
} as const satisfies Record<string, PlannedConfig>;
