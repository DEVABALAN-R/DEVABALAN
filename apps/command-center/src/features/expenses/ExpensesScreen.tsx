import { useMemo } from 'react';
import { View } from 'react-native';
import { CalendarDays, Plus } from '@/components/icons';
import { BentoCell, BentoRow } from '@/components/layout/Bento';
import { PageHeader } from '@/components/layout/PageHeader';
import { Screen, useFitMode } from '@/components/layout/Screen';
import { Button, Text } from '@/components/ui';
import { SampleDataBadge } from '@/features/preview/SampleDataBadge';
import { useOverviewData } from '@/features/preview/useOverviewData';
import { useUiStore } from '@/state/ui';
import { useTheme } from '@/theme';
import { CalendarHeatmap } from './CalendarHeatmap';
import { CategoryBreakdown } from './CategoryBreakdown';
import { DailySpendCard } from './DailySpendCard';
import { SpendSummaryCard } from './SpendSummaryCard';
import { TransactionsPanel } from './TransactionsPanel';

/** Expense manager: one screen on desktop (panels scroll internally). */
export function ExpensesScreen() {
  const theme = useTheme();
  const data = useOverviewData();
  const fit = useFitMode(true);
  const openQuickAdd = useUiStore((state) => state.openQuickAdd);
  const month = useMemo(
    () => new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date()),
    [],
  );
  const grow = fit ? { flex: 1 } : undefined;
  return (
    <Screen fit>
      <PageHeader
        size="compact"
        title="Expense manager"
        meta={<SampleDataBadge />}
        actions={
          <>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                height: 44,
                paddingHorizontal: theme.space[4],
                borderRadius: theme.radius.pill,
                backgroundColor: theme.colors.surface,
              }}
            >
              <CalendarDays size={16} color={theme.colors.textSecondary} />
              <Text variant="label">{month}</Text>
            </View>
            <Button label="Add expense" icon={Plus} onPress={openQuickAdd} />
          </>
        }
      />
      <BentoRow stackBelow="desktop" fill={1}>
        <BentoCell flex={3}>
          <SpendSummaryCard
            spent={data.expense}
            income={data.income}
            budget={data.budget}
            delta={data.expenseDelta}
          />
          <CalendarHeatmap transactions={data.transactions} style={grow} />
        </BentoCell>
        <BentoCell flex={5}>
          <DailySpendCard
            transactions={data.transactions}
            budget={data.budget}
            style={fit ? { flex: 0.9 } : { height: 280 }}
          />
          <TransactionsPanel
            transactions={data.transactions}
            style={fit ? { flex: 1.25 } : { height: 460 }}
          />
        </BentoCell>
        <BentoCell flex={3}>
          <CategoryBreakdown
            transactions={data.transactions}
            style={fit ? { flex: 1 } : { height: 560 }}
          />
        </BentoCell>
      </BentoRow>
    </Screen>
  );
}
