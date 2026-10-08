import { View } from 'react-native';
import { Download, Monitor, Moon, Shield, Sun } from '@/components/icons';
import { BentoCell, BentoRow } from '@/components/layout/Bento';
import { PageHeader } from '@/components/layout/PageHeader';
import { Screen } from '@/components/layout/Screen';
import { Badge, Card, CardHeader, CategoryIcon, SegmentedControl, Text } from '@/components/ui';
import { useUiStore, type ThemePreference } from '@/state/ui';
import { useTheme, type ColorRoles } from '@/theme';
import { useSession } from '@/features/auth/sessionStore';
import { AccountCard } from './AccountCard';
import { SecurityCard } from './SecurityCard';

const themeSegments = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const satisfies readonly { value: ThemePreference; label: string }[];

export function SettingsScreen() {
  const theme = useTheme();
  const preference = useUiStore((state) => state.themePreference);
  const setPreference = useUiStore((state) => state.setThemePreference);
  const Icon = preference === 'dark' ? Moon : preference === 'light' ? Sun : Monitor;
  const signedIn = useSession((state) => state.status === 'signedIn');
  return (
    <Screen>
      <PageHeader
        title="Settings"
        description="Appearance, your account, and data controls as they arrive."
      />
      <BentoRow>
        <BentoCell>
          <Card index={0} style={{ gap: theme.space[4] }}>
            <CardHeader
              title="Appearance"
              subtitle="This device for now · saved to your account from Phase 3"
              action={<CategoryIcon icon={Icon} tint={0} size={40} />}
            />
            <SegmentedControl
              segments={themeSegments}
              value={preference}
              onChange={setPreference}
              accessibilityLabel="Theme"
            />
            <View style={{ flexDirection: 'row', gap: theme.space[2] }}>
              {(['primary', 'brandFrom', 'ink', 'chart'] as const).map((role, index) => (
                <View
                  key={role}
                  aria-hidden
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: theme.radius.md,
                    backgroundColor:
                      role === 'chart'
                        ? theme.colors.chart[index]
                        : (theme.colors[role as keyof ColorRoles] as string),
                  }}
                />
              ))}
            </View>
          </Card>
        </BentoCell>
        <BentoCell>
          <AccountCard index={1} />
          {signedIn ? <SecurityCard index={2} /> : null}
          <Planned
            index={3}
            icon={Download}
            tint={4}
            title="Data & privacy"
            phase={9}
            body="CSV/JSON export, CSV import with preview and rollback, and account deletion."
          />
        </BentoCell>
      </BentoRow>
    </Screen>
  );
}

type PlannedProps = {
  index: number;
  icon: typeof Shield;
  tint: number;
  title: string;
  phase: number;
  body: string;
};

function Planned({ index, icon, tint, title, phase, body }: PlannedProps) {
  const theme = useTheme();
  return (
    <Card index={index} style={{ gap: theme.space[3] }}>
      <CardHeader title={title} action={<CategoryIcon icon={icon} tint={tint} size={40} />} />
      <Badge label={`Planned · Phase ${phase}`} tone="warning" />
      <Text color="textSecondary">{body}</Text>
    </Card>
  );
}
