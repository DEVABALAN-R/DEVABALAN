import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Badge, Text } from '@/components/ui';
import { SwitchRow } from '@/features/investments/components/SwitchRow';
import { parseIsoDate } from '@/lib/domain/expenses';
import type { HoldingPlan, PlannedTrade } from '@/lib/domain/investments';
import { formatMoney } from '@/lib/formatting/currency';
import { useTheme } from '@/theme';

const SHOWN = 6;
// Tradebooks span years, so every trade shows its year.
const tradeDay = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export const quantityText = (plan: Pick<HoldingPlan, 'segment'>, quantity: number) =>
  plan.segment === 'funds'
    ? quantity.toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 4 })
    : quantity.toLocaleString('en-IN');

const priceText = (plan: HoldingPlan, price: number) =>
  `₹${price.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: plan.segment === 'funds' ? 4 : 2,
  })}`;

function TradeRow({
  cells,
  tone,
}: {
  cells: string[];
  tone?: 'income' | 'expense' | 'textTertiary';
}) {
  const theme = useTheme();
  const cell = { flex: 1, minWidth: 0 } as const;
  const [date, kind, quantity, price, amount] = cells;
  const heading = tone === 'textTertiary';
  return (
    <View style={{ flexDirection: 'row', gap: theme.space[2] }}>
      <Text variant="caption" color={heading ? tone : undefined} style={cell}>
        {date}
      </Text>
      <Text variant="caption" color={tone} style={{ width: 34 }}>
        {kind}
      </Text>
      {[quantity, price, amount].map((text, index) => (
        <Text
          key={index}
          variant="caption"
          color={heading ? tone : undefined}
          style={{ ...cell, textAlign: 'right' }}
        >
          {text}
        </Text>
      ))}
    </View>
  );
}

const tradeCells = (plan: HoldingPlan, trade: PlannedTrade) => [
  tradeDay.format(parseIsoDate(trade.date)),
  trade.kind === 'buy' ? 'Buy' : 'Sell',
  quantityText(plan, trade.quantity),
  priceText(plan, trade.price),
  formatMoney(trade.amount),
];

/** One holding to review: the trades to add, and what it will hold afterwards. */
export function ImportHoldingCard({
  plan,
  on,
  onToggle,
}: {
  plan: HoldingPlan;
  on: boolean;
  onToggle: (on: boolean) => void;
}) {
  const theme = useTheme();
  const [all, setAll] = useState(false);
  const unit = plan.segment === 'funds' ? 'Units' : 'Shares';
  const trades = all ? plan.add : plan.add.slice(0, SHOWN);
  const isNew = !plan.existingId;
  return (
    <View
      style={{
        gap: theme.space[2],
        padding: theme.space[3],
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: on ? theme.colors.accent : theme.colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[2] }}>
        <Text variant="label" numberOfLines={2} style={{ flex: 1, minWidth: 0 }}>
          {plan.name}
        </Text>
        <Badge
          label={isNew ? (plan.segment === 'funds' ? 'New fund' : 'New stock') : 'In the app'}
          tone={isNew ? 'info' : 'neutral'}
        />
      </View>
      <Text variant="caption" color="textTertiary">
        {plan.isin}
        {plan.already ? ` · ${plan.already} already in the app` : ''}
      </Text>
      <SwitchRow
        label={`Add ${plan.add.length} ${plan.add.length === 1 ? 'trade' : 'trades'}`}
        value={on}
        onChange={onToggle}
      />
      <View style={{ gap: 2 }}>
        <TradeRow
          tone="textTertiary"
          cells={['Date', '', unit, plan.segment === 'funds' ? 'NAV' : 'Price', 'Amount']}
        />
        {trades.map((trade, index) => (
          <TradeRow
            key={`${trade.date}-${index}`}
            tone={trade.kind === 'buy' ? 'income' : 'expense'}
            cells={tradeCells(plan, trade)}
          />
        ))}
        {plan.add.length > SHOWN ? (
          <Pressable role="button" onPress={() => setAll(!all)} hitSlop={8}>
            <Text variant="caption" color="accent">
              {all ? 'Show fewer' : `Show all ${plan.add.length}`}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <Text variant="caption" color="textSecondary">
        {unit} {quantityText(plan, plan.before.held)} → {quantityText(plan, plan.after.held)} ·
        Invested {formatMoney(plan.before.invested)} → {formatMoney(plan.after.invested)}
      </Text>
      {plan.leftOut.length ? (
        <Text variant="caption" color="textTertiary">
          {plan.leftOut.length} earlier {plan.leftOut.length === 1 ? 'trade is' : 'trades are'} left
          out: {plan.leftOut.length === 1 ? 'it sells' : 'they sell'} {unit.toLowerCase()} bought
          before this file starts.
        </Text>
      ) : null}
    </View>
  );
}
