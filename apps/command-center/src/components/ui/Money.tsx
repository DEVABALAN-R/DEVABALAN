import { formatMoney, moneyAccessibilityLabel, type SignDisplay } from '@/lib/formatting/currency';
import { Text, type TextProps } from './Text';

export type MoneyTone = 'neutral' | 'income' | 'expense' | 'profit' | 'loss' | 'auto';

type MoneyProps = Omit<TextProps, 'children' | 'color'> & {
  /** Integer minor units (paise). */
  value: number;
  currency?: string;
  compact?: boolean;
  signDisplay?: SignDisplay;
  /** `auto` colours positive as profit and negative as loss; the sign is always shown too. */
  tone?: MoneyTone;
};

const toneColor = {
  neutral: 'textPrimary',
  income: 'income',
  expense: 'expense',
  profit: 'profit',
  loss: 'loss',
} as const;

export function Money({
  value,
  currency,
  compact,
  signDisplay = 'auto',
  tone = 'neutral',
  ...rest
}: MoneyProps) {
  const resolvedTone =
    tone === 'auto' ? (value > 0 ? 'profit' : value < 0 ? 'loss' : 'neutral') : tone;
  const effectiveSign = tone === 'auto' && signDisplay === 'auto' ? 'always' : signDisplay;
  const options = { currency, compact, signDisplay: effectiveSign };
  return (
    <Text
      numeric
      color={toneColor[resolvedTone]}
      accessibilityLabel={moneyAccessibilityLabel(value, options)}
      {...rest}
    >
      {formatMoney(value, options)}
    </Text>
  );
}
