import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, Card, CardHeader } from '@/components/ui';
import { TransactionRow, TransactionTableHeader } from '@/features/expenses/TransactionRow';
import type { SampleTransaction } from '@/features/preview/sampleExpenses';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useTheme } from '@/theme';

export function RecentActivityCard({
  transactions,
  index = 9,
}: {
  transactions: SampleTransaction[];
  index?: number;
}) {
  const theme = useTheme();
  const { isMobile } = useBreakpoint();
  return (
    <Card index={index} style={{ gap: theme.space[2], flex: 1 }}>
      <CardHeader
        title="Recent activity"
        subtitle="Latest income and expenses"
        action={
          <Button
            label="View all"
            variant="secondary"
            size="sm"
            onPress={() => router.push('/dashboard/expenses')}
          />
        }
      />
      <View>
        {isMobile ? null : <TransactionTableHeader />}
        {transactions.slice(0, 6).map((row) => (
          <TransactionRow key={row.id} row={row} layout={isMobile ? 'compact' : 'table'} />
        ))}
      </View>
    </Card>
  );
}
