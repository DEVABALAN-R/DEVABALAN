import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Badge, Text } from '@/components/ui';
import {
  accountGap,
  categoryGap,
  fundMatches,
  type AccountCheck,
  type CategoryCheck,
  type FundCheck,
  type SkippedGroup,
} from '@/lib/domain/legacyImport';
import { formatMoney } from '@/lib/formatting/currency';
import { useTheme } from '@/theme';

const money = (paise: number) => formatMoney(paise);
const signed = (paise: number) => formatMoney(paise, { signDisplay: 'always' });
const units = (value: number) =>
  value.toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 4 });

export function ReportSection({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.space[2], marginTop: theme.space[4] }}>
      <Text variant="eyebrow" color="textTertiary" role="heading">
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function Row({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        gap: 2,
        padding: theme.space[3],
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[2] }}>
        <Text variant="label" numberOfLines={1} style={{ flex: 1, minWidth: 0 }}>
          {title}
        </Text>
        {badge}
      </View>
      {children}
    </View>
  );
}

const Line = ({ children, strong = false }: { children: ReactNode; strong?: boolean }) => (
  <Text variant="caption" color={strong ? 'textSecondary' : 'textTertiary'}>
    {children}
  </Text>
);

/** Old balance next to the new one, with the reasons they differ. */
export function AccountRow({ account }: { account: AccountCheck }) {
  const gap = accountGap(account);
  const renamed =
    account.legacyName && account.legacyName.toLowerCase() !== account.name.toLowerCase();
  const badge =
    gap === 0 ? (
      <Badge label="Matches" tone="success" />
    ) : account.reused ? (
      <Badge label="Already here" tone="info" />
    ) : (
      <Badge label="Check" tone="warning" />
    );
  return (
    <Row title={account.name} badge={badge}>
      <Line strong>
        Old app {money(account.legacy)} · here {money(account.current)}
      </Line>
      {renamed ? <Line>Called “{account.legacyName}” in the old app.</Line> : null}
      {account.transfers !== 0 ? (
        <Line>
          {signed(account.transfers)} from card payments and transfers: the old app did not count
          them in this account.
        </Line>
      ) : null}
      {account.skipped !== 0 ? (
        <Line>{money(Math.abs(account.skipped))} in entries that cannot be brought over.</Line>
      ) : null}
      {gap !== 0 ? (
        <Line>
          {account.reused
            ? `It was already in the app, so its own opening balance is kept: ${signed(gap)}.`
            : `Differs by ${signed(gap)} for a reason the check cannot explain.`}
        </Line>
      ) : null}
    </Row>
  );
}

export function CategoryRow({ category }: { category: CategoryCheck }) {
  const gap = categoryGap(category);
  return (
    <Row title={`${category.name || 'No category'} · ${category.kind}`}>
      <Line strong>
        Old app {money(category.legacy)} · here {money(category.current)}
      </Line>
      {gap !== 0 ? (
        <Line>{money(Math.abs(gap))} in entries that cannot be brought over.</Line>
      ) : null}
    </Row>
  );
}

export function FundRow({ fund }: { fund: FundCheck }) {
  const ok = fundMatches(fund);
  return (
    <Row
      title={fund.name}
      badge={<Badge label={ok ? 'Matches' : 'Check'} tone={ok ? 'success' : 'warning'} />}
    >
      <Line strong>
        Invested: old app {money(fund.legacyInvested)} · here {money(fund.currentInvested)}
      </Line>
      <Line>
        Units: old app {units(fund.legacyUnits)} · here {units(fund.currentUnits)}
      </Line>
      {fund.skipped ? (
        <Line>
          {fund.skipped} {fund.skipped === 1 ? 'purchase' : 'purchases'} cannot be brought over.
        </Line>
      ) : null}
    </Row>
  );
}

const AREA_NAMES: Record<string, [string, string]> = {
  accounts: ['account', 'accounts'],
  transactions: ['entry', 'entries'],
  funds: ['fund', 'funds'],
  'fund purchases': ['fund purchase', 'fund purchases'],
};

export function SkippedRow({ group }: { group: SkippedGroup }) {
  const [one, many] = AREA_NAMES[group.area] ?? [group.area, group.area];
  const reason = group.reason.charAt(0).toUpperCase() + group.reason.slice(1);
  return (
    <Row title={reason}>
      <Line strong>
        {group.count} {group.count === 1 ? one : many}
      </Line>
    </Row>
  );
}
