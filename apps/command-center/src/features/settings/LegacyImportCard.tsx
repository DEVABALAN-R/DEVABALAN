import { useState } from 'react';
import { View } from 'react-native';
import { ArchiveRestore } from '@/components/icons';
import { useToast } from '@/components/feedback';
import { ConfirmSheet } from '@/components/overlays';
import { Badge, Button, Card, CardHeader, CategoryIcon, Text } from '@/components/ui';
import { dayLabel, toIsoDate } from '@/lib/domain/expenses';
import {
  addedTotal,
  reportIssues,
  skippedTotal,
  summaryLine,
  type ImportReport,
} from '@/lib/domain/legacyImport';
import { useTheme } from '@/theme';
import { LegacyImportReportSheet } from './LegacyImportReportSheet';
import { useLegacyImport } from './useLegacyImport';

const issueCount = (report: ImportReport) => {
  const issues = reportIssues(report);
  return issues.accounts.filter((account) => !account.reused).length + issues.funds.length;
};

/** Brings over what was saved in the previous app: check first, then import. */
export function LegacyImportCard({ index }: { index: number }) {
  const theme = useTheme();
  const toast = useToast();
  const { phase, report, error, check, runImport } = useLegacyImport();
  const [confirming, setConfirming] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const busy = phase === 'checking' || phase === 'importing';
  const preview = report?.status === 'preview' ? report : null;
  const canImport = !!preview && addedTotal(preview) > 0;

  const confirmImport = async () => {
    const result = await runImport();
    setConfirming(false);
    setShowReport(false);
    if (result?.status === 'imported') toast.show({ message: summaryLine(result) });
  };

  return (
    <Card index={index} style={{ gap: theme.space[3] }}>
      <CardHeader
        title="Old app's data"
        subtitle="Entries, accounts, categories and funds"
        action={<CategoryIcon icon={ArchiveRestore} tint={5} size={40} />}
      />
      {report?.importedAt ? (
        <Badge
          label={`Imported ${dayLabel(toIsoDate(new Date(report.importedAt)), 'short')}`}
          tone="success"
        />
      ) : null}
      {!report || phase === 'failed' ? (
        <Text color="textSecondary">
          Bring over what you saved in the previous app. A check runs first and shows the result;
          nothing is saved until you import.
        </Text>
      ) : report.status === 'none' ? (
        <Text color="textSecondary">The old app has no saved data for this account.</Text>
      ) : (
        <View style={{ gap: theme.space[2] }}>
          <Text color="textSecondary">{summaryLine(report)}</Text>
          {skippedTotal(report) ? (
            <Text variant="caption" color="textTertiary">
              {skippedTotal(report)} {skippedTotal(report) === 1 ? 'item' : 'items'} cannot be
              brought over; the report says why.
            </Text>
          ) : null}
          {issueCount(report) ? (
            <Badge label={`${issueCount(report)} to review in the report`} tone="warning" />
          ) : (
            <Badge label="Totals match" tone="success" />
          )}
          {report.importedAt && canImport ? (
            <Text variant="caption" color="textTertiary">
              Importing again adds only what is missing, including entries you deleted since.
            </Text>
          ) : null}
        </View>
      )}
      {error ? (
        <Text variant="caption" color="danger" role="alert">
          {error}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2] }}>
        {report && report.status !== 'none' && phase !== 'failed' ? (
          <Button label="View report" variant="secondary" onPress={() => setShowReport(true)} />
        ) : null}
        {canImport ? (
          <Button
            label="Import"
            onPress={() => setConfirming(true)}
            loading={phase === 'importing'}
          />
        ) : (
          <Button
            label={report ? 'Check again' : 'Check old data'}
            variant={report ? 'secondary' : 'primary'}
            onPress={() => void check()}
            loading={phase === 'checking'}
            disabled={busy}
          />
        )}
      </View>
      {showReport && report ? (
        <LegacyImportReportSheet
          report={report}
          onClose={() => setShowReport(false)}
          onImport={
            canImport
              ? () => {
                  setShowReport(false);
                  setConfirming(true);
                }
              : undefined
          }
          busy={phase === 'importing'}
        />
      ) : null}
      <ConfirmSheet
        visible={confirming}
        title="Import from the old app?"
        message={`${preview ? summaryLine(preview) : ''} Your changes are saved first, then everything reloads. Running it again never duplicates anything.`}
        confirmLabel="Import"
        busy={phase === 'importing'}
        onConfirm={() => void confirmImport()}
        onCancel={() => setConfirming(false)}
      />
    </Card>
  );
}
