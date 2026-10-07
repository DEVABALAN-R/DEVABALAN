import type { LucideIcon } from '@/components/icons';
import { View } from 'react-native';
import { EmptyState } from '@/components/feedback';
import { PageHeader } from '@/components/layout/PageHeader';
import { Screen } from '@/components/layout/Screen';
import { Badge, Card, Text } from '@/components/ui';
import { useTheme } from '@/theme';

type PlannedScreenProps = {
  title: string;
  eyebrow?: string;
  description: string;
  icon: LucideIcon;
  phase: number;
  /** What this screen will contain, shown so the placeholder is honest and useful. */
  upcoming: readonly string[];
};

/**
 * Clearly marked placeholder for a destination whose feature ships in a later
 * phase. It renders no data and performs no actions.
 */
export function PlannedScreen({
  title,
  eyebrow,
  description,
  icon,
  phase,
  upcoming,
}: PlannedScreenProps) {
  const theme = useTheme();
  return (
    <Screen>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={<Badge label={`Planned · Phase ${phase}`} tone="warning" />}
      />
      <Card>
        <EmptyState
          icon={icon}
          title={`${title} is coming in Phase ${phase}`}
          body="This page is a placeholder in the new app shell. No data is shown or changed here."
        />
        <View style={{ gap: theme.space[2], paddingHorizontal: theme.space[2] }}>
          <Text variant="label" color="textSecondary" uppercase>
            What will be here
          </Text>
          {upcoming.map((item) => (
            <Text key={item} color="textSecondary">
              • {item}
            </Text>
          ))}
        </View>
      </Card>
    </Screen>
  );
}
