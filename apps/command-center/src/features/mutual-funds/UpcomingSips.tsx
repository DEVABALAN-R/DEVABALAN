import { ScrollView, View } from 'react-native';
import { Repeat } from '@/components/icons';
import { Badge, Card, CardHeader, CategoryIcon, Money, Text } from '@/components/ui';
import { upcomingSips } from '@/features/preview/sampleInvestments';
import { useTheme } from '@/theme';

export function UpcomingSips({ style }: { style?: object }) {
  const theme = useTheme();
  const sips = upcomingSips();
  const today = new Date();
  return (
    <Card index={8} padding={4} style={[{ gap: theme.space[2] }, style]}>
      <View style={{ paddingHorizontal: theme.space[1] }}>
        <CardHeader
          title="Upcoming SIPs"
          subtitle={`${sips.length} scheduled`}
          action={<Repeat size={18} color={theme.colors.textSecondary} />}
        />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: theme.space[2] }}
        nestedScrollEnabled
      >
        {sips.map(({ fund, date }) => {
          const days = Math.ceil(
            (date.getTime() -
              new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) /
              86_400_000,
          );
          return (
            <View
              key={fund.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.space[3],
                padding: theme.space[3],
                borderRadius: theme.radius.lg,
                backgroundColor: theme.colors.surfaceMuted,
              }}
            >
              <CategoryIcon icon={fund.icon} tint={fund.tint} size={34} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="label" numberOfLines={1}>
                  {fund.name}
                </Text>
                <Text variant="caption" color="textSecondary">
                  {new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(
                    date,
                  )}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Money value={fund.sip} variant="label" />
                <Badge
                  label={days <= 0 ? 'Today' : `in ${days}d`}
                  tone={days <= 3 ? 'warning' : 'neutral'}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Card>
  );
}
