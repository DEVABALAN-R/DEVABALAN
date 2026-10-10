import { View } from 'react-native';
import { Sheet } from '@/components/overlays';
import { Button, Text } from '@/components/ui';
import { dayLabel } from '@/lib/domain/expenses';
import { reportIssues, summaryLine, type ImportReport } from '@/lib/domain/legacyImport';
import { useTheme } from '@/theme';
import { AccountRow, CategoryRow, FundRow, ReportSection, SkippedRow } from './LegacyImportRows';

type Props = {
  report: ImportReport;
  onClose: () => void;
  /** Offered while the report is a check and there is something to add. */
  onImport?: () => void;
  busy?: boolean;
};

/** The check report: the old app's totals next to what the import adds, line by line. */
export function LegacyImportReportSheet({ report, onClose, onImport, busy = false }: Props) {
  const theme = useTheme();
  const issues = reportIssues(report);
  const matched = report.categories.length - issues.categories.length;
  const asOf = report.asOf ? ` · balances on ${dayLabel(report.asOf, 'short')}` : '';
  return (
    <Sheet
      visible
      onClose={onClose}
      title="Import check"
      description={`The old app next to what the import ${report.status === 'imported' ? 'added' : 'adds'}${asOf}`}
      width={620}
      footer={
        <>
          <Button label="Close" variant="secondary" onPress={onClose} />
          {onImport ? (
            <>
              <View style={{ flex: 1 }} />
              <Button label="Import" onPress={onImport} loading={busy} />
            </>
          ) : null}
        </>
      }
    >
      <Text color="textSecondary">{summaryLine(report)}</Text>
      {report.accounts.length ? (
        <ReportSection title="Accounts">
          {report.accounts.map((account, index) => (
            <AccountRow key={`${account.name}-${index}`} account={account} />
          ))}
        </ReportSection>
      ) : null}
      {report.categories.length ? (
        <ReportSection title="Categories">
          <Text variant="caption" color="textSecondary">
            {matched} of {report.categories.length} category totals match exactly.
          </Text>
          {issues.categories.map((category) => (
            <CategoryRow key={`${category.kind}-${category.name}`} category={category} />
          ))}
        </ReportSection>
      ) : null}
      {report.funds.length ? (
        <ReportSection title="Mutual funds">
          {report.funds.map((fund, index) => (
            <FundRow key={`${fund.name}-${index}`} fund={fund} />
          ))}
        </ReportSection>
      ) : null}
      {report.skipped.length ? (
        <ReportSection title="Cannot be brought over">
          {report.skipped.map((group) => (
            <SkippedRow key={`${group.area}-${group.reason}`} group={group} />
          ))}
        </ReportSection>
      ) : null}
      <View style={{ gap: theme.space[1], marginTop: theme.space[4] }}>
        <Text variant="caption" color="textTertiary">
          Card payments become transfers, so the paying account goes down by the amount paid. Card
          balances show what you owe as a negative amount.
        </Text>
        <Text variant="caption" color="textTertiary">
          Funds come in with the last NAV you saved; link each to its AMFI scheme from Edit fund to
          get daily NAVs.
        </Text>
      </View>
    </Sheet>
  );
}
