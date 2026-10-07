import { View } from 'react-native';
import { PageHeader } from '@/components/layout/PageHeader';
import { Screen } from '@/components/layout/Screen';
import { Section } from '@/components/layout/Section';
import { Badge, Card, SegmentedControl, Text } from '@/components/ui';
import { useUiStore, type ThemePreference } from '@/state/ui';
import { useTheme } from '@/theme';

const themeSegments = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const satisfies readonly { value: ThemePreference; label: string }[];

export function SettingsScreen() {
  const theme = useTheme();
  const preference = useUiStore((state) => state.themePreference);
  const setPreference = useUiStore((state) => state.setThemePreference);
  return (
    <Screen>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Appearance now; account, security and data controls arrive in later phases."
      />
      <Section
        title="Appearance"
        description="Applies to this device for now. Saved to your account from Phase 3."
      >
        <Card>
          <SegmentedControl
            segments={themeSegments}
            value={preference}
            onChange={setPreference}
            accessibilityLabel="Theme"
          />
        </Card>
      </Section>
      <Section
        title="Account & security"
        description="Sign-in, two-factor authentication, sessions and devices."
      >
        <Card tone="muted">
          <View style={{ gap: theme.space[2] }}>
            <Badge label="Planned · Phase 2" tone="warning" />
            <Text color="textSecondary">
              Password, two-factor (TOTP), active sessions and sign out of other devices.
            </Text>
          </View>
        </Card>
      </Section>
      <Section title="Data & privacy" description="Import, export, backup and account deletion.">
        <Card tone="muted">
          <View style={{ gap: theme.space[2] }}>
            <Badge label="Planned · Phase 9" tone="warning" />
            <Text color="textSecondary">
              CSV/JSON export, CSV import with preview and rollback, and account deletion.
            </Text>
          </View>
        </Card>
      </Section>
    </Screen>
  );
}
