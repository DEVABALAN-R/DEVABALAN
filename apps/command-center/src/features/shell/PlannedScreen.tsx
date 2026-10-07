import { View } from 'react-native';
import type { LucideIcon } from '@/components/icons';
import { PageHeader } from '@/components/layout/PageHeader';
import { Screen } from '@/components/layout/Screen';
import { Badge, Card, CategoryIcon, Text } from '@/components/ui';
import { useTheme } from '@/theme';

type PlannedScreenProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  phase: number;
  /** What this screen will contain, shown so the placeholder is honest and useful. */
  upcoming: readonly string[];
};

/** Clearly marked placeholder for a destination whose module ships later. Reads no data. */
export function PlannedScreen({ title, description, icon, phase, upcoming }: PlannedScreenProps) {
  const theme = useTheme();
  return (
    <Screen>
      <PageHeader
        title={title}
        description={description}
        meta={<Badge label={`Planned · Phase ${phase}`} tone="warning" />}
      />
      <Card index={0} padding={8}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.space[8],
            alignItems: 'center',
          }}
        >
          <View style={{ flex: 1, minWidth: 260, gap: theme.space[3] }}>
            <CategoryIcon icon={icon} tint={phase} size={64} />
            <Text variant="h2">Coming in Phase {phase}</Text>
            <Text color="textSecondary">
              This page is a placeholder in the new design. No data is shown or changed here.
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 260, gap: theme.space[2] }}>
            {upcoming.map((item, index) => (
              <View
                key={item}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.space[3],
                  padding: theme.space[3],
                  borderRadius: theme.radius.lg,
                  backgroundColor: theme.colors.surfaceMuted,
                }}
              >
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.colors.primary,
                  }}
                >
                  <Text variant="caption" color="onPrimary">
                    {index + 1}
                  </Text>
                </View>
                <Text style={{ flex: 1 }}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </Card>
    </Screen>
  );
}
