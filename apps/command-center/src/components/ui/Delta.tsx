import { ArrowDownRight, ArrowUpRight, Minus } from '@/components/icons';
import { StyleSheet, View } from 'react-native';
import { formatMoney, formatPercent, moneyAccessibilityLabel } from '@/lib/formatting/currency';
import { useTheme } from '@/theme';
import { Text } from './Text';

type DeltaProps = {
  /** Percent value (e.g. 18.2) or integer minor units, depending on `format`. */
  value: number;
  format?: 'percent' | 'money';
  /** Which direction is favourable for this metric (expenses: down). */
  goodWhen?: 'up' | 'down';
  /** e.g. "vs Sep". Shown and read aloud. */
  comparison?: string;
};

/**
 * Change indicator. Direction is conveyed by arrow, sign and words — never by
 * colour alone.
 */
export function Delta({ value, format = 'percent', goodWhen = 'up', comparison }: DeltaProps) {
  const theme = useTheme();
  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  const favourable = direction === 'flat' ? null : direction === goodWhen;
  const color = favourable === null ? 'textSecondary' : favourable ? 'success' : 'danger';
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;
  const text =
    direction === 'flat'
      ? 'No change'
      : format === 'percent'
        ? formatPercent(value)
        : formatMoney(value, { signDisplay: 'always' });
  const spoken =
    direction === 'flat'
      ? 'No change'
      : `${direction === 'up' ? 'Up' : 'Down'} ${
          format === 'percent'
            ? `${Math.abs(value).toFixed(1)} percent`
            : moneyAccessibilityLabel(Math.abs(value))
        }`;
  const verdict = favourable === null ? '' : favourable ? ', favourable' : ', unfavourable';

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${spoken}${comparison ? ` ${comparison}` : ''}${verdict}`}
    >
      <Icon size={14} color={theme.colors[color]} strokeWidth={2.25} />
      <Text variant="label" color={color} numeric>
        {text}
      </Text>
      {comparison ? (
        <Text variant="label" color="textSecondary">
          {comparison}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
});
