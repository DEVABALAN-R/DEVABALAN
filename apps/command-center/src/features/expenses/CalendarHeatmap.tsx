import { View } from 'react-native';
import { Card, CardHeader, Text } from '@/components/ui';
import { formatMoneyWhole } from '@/lib/formatting/currency';
import type { SampleTransaction } from '@/features/preview/sampleExpenses';
import { isoDate } from '@/features/preview/random';
import { useTheme } from '@/theme';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Month grid coloured by daily spend (5 steps, light → deep green). */
export function CalendarHeatmap({
  transactions,
  style,
}: {
  transactions: SampleTransaction[];
  style?: object;
}) {
  const theme = useTheme();
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const totals = new Map<string, number>();
  for (const row of transactions)
    if (row.kind === 'expense') totals.set(row.date, (totals.get(row.date) ?? 0) + row.amount);
  const max = Math.max(1, ...totals.values());
  const steps = [
    theme.colors.surfaceMuted,
    theme.colors.primarySoft,
    theme.colors.primary,
    theme.colors.brandFrom,
    theme.colors.brandTo,
  ];
  const cells = Array.from(
    { length: Math.ceil((offset + days) / 7) * 7 },
    (_, index) => index - offset + 1,
  );
  const monthName = new Intl.DateTimeFormat('en-IN', { month: 'long' }).format(today);
  return (
    <Card index={1} style={[{ gap: theme.space[3] }, style]}>
      <CardHeader title="Spending calendar" subtitle={`${monthName} · darker = more spent`} />
      <View style={{ flexDirection: 'row' }}>
        {WEEKDAYS.map((day, index) => (
          <Text
            key={index}
            variant="caption"
            color="textTertiary"
            align="center"
            style={{ flex: 1 }}
          >
            {day}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 4 }}>
        {cells.map((day, index) => {
          if (day < 1 || day > days)
            return <View key={index} style={{ width: `${100 / 7}%`, height: 42 }} />;
          const key = isoDate(new Date(today.getFullYear(), today.getMonth(), day));
          const amount = totals.get(key) ?? 0;
          const future = day > today.getDate();
          const step =
            future || amount === 0 ? 0 : Math.min(4, 1 + Math.floor((amount / max) * 3.999));
          const isToday = day === today.getDate();
          return (
            <View key={index} style={{ width: `${100 / 7}%`, height: 42, padding: 3 }}>
              <View
                accessible
                accessibilityLabel={`${day} ${monthName}: ${future ? 'upcoming' : amount ? `${formatMoneyWhole(amount)} spent` : 'no spending'}`}
                style={{
                  flex: 1,
                  borderRadius: theme.radius.sm,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: steps[step],
                  borderWidth: isToday ? 2 : 0,
                  borderColor: theme.colors.ink,
                  opacity: future ? 0.5 : 1,
                }}
              >
                <Text
                  variant="caption"
                  style={{
                    color:
                      step >= 3
                        ? theme.colors.onBrand
                        : step === 2
                          ? theme.colors.onPrimary
                          : theme.colors.textSecondary,
                  }}
                >
                  {day}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
