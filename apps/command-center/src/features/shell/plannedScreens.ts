import { FileChartColumn, Flag, Lightbulb } from '@/components/icons';
import type { ComponentProps } from 'react';
import type { PlannedScreen } from './PlannedScreen';

type PlannedConfig = ComponentProps<typeof PlannedScreen>;

/** Placeholder copy for destinations whose modules ship in later phases (plan §22). */
export const plannedScreens = {
  goals: {
    title: 'Goals',
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
    description: 'Monthly, category, investment and annual reports.',
    icon: FileChartColumn,
    phase: 7,
    upcoming: ['Date range and comparison period', 'Charts with table view', 'CSV export'],
  },
} as const satisfies Record<string, PlannedConfig>;
