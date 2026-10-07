import { View } from 'react-native';
import { ChevronLeft, ChevronRight } from '@/components/icons';
import { Chip, IconButton, Text } from '@/components/ui';
import { monthLabel, monthOf, todayIso, yearOfMonth } from '@/lib/domain/expenses';
import { useTheme } from '@/theme';
import { useExpenseUi } from '../state/expenseUi';

/** ‹ October 2026 › — shared month (or year) selector for all Expenses pages. */
export function MonthNavigator({
  mode = 'month',
  stretch = false,
}: {
  mode?: 'month' | 'year';
  stretch?: boolean;
}) {
  const theme = useTheme();
  const month = useExpenseUi((state) => state.month);
  const shiftMonth = useExpenseUi((state) => state.shiftMonth);
  const goToCurrentMonth = useExpenseUi((state) => state.goToCurrentMonth);
  const current = monthOf(todayIso());
  const step = mode === 'year' ? 12 : 1;
  const label = mode === 'year' ? String(yearOfMonth(month)) : monthLabel(month);
  const isCurrent =
    mode === 'year' ? yearOfMonth(month) === yearOfMonth(current) : month === current;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space[2],
        alignSelf: stretch ? 'stretch' : 'auto',
      }}
    >
      <View
        style={{
          flex: stretch ? 1 : undefined,
          flexDirection: 'row',
          alignItems: 'center',
          height: 44,
          paddingHorizontal: 2,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.surface,
        }}
      >
        <IconButton
          icon={ChevronLeft}
          size="sm"
          accessibilityLabel={`Previous ${mode}`}
          onPress={() => shiftMonth(-step)}
        />
        <Text
          variant="bodyStrong"
          align="center"
          style={{ minWidth: mode === 'year' ? 64 : 136, flex: stretch ? 1 : undefined }}
          accessibilityLiveRegion="polite"
        >
          {label}
        </Text>
        <IconButton
          icon={ChevronRight}
          size="sm"
          accessibilityLabel={`Next ${mode}`}
          onPress={() => shiftMonth(step)}
        />
      </View>
      {isCurrent ? null : (
        <Chip label={mode === 'year' ? 'This year' : 'This month'} onPress={goToCurrentMonth} />
      )}
    </View>
  );
}
