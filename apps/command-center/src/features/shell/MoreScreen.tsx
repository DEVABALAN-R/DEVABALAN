import { Link, type Href } from 'expo-router';
import { ChevronRight } from '@/components/icons';
import { Pressable, View } from 'react-native';
import { PageHeader } from '@/components/layout/PageHeader';
import { Screen } from '@/components/layout/Screen';
import { Card, Divider, Text } from '@/components/ui';
import { minHitSize, useTheme } from '@/theme';
import { mobileMore } from './navigation';

/** Mobile overflow navigation for destinations not in the bottom bar. */
export function MoreScreen() {
  const theme = useTheme();
  return (
    <Screen>
      <PageHeader title="More" />
      <Card padding={0}>
        {mobileMore.map((item, index) => (
          <View key={item.name}>
            {index > 0 ? <Divider /> : null}
            <Link href={item.href as Href} asChild>
              <Pressable
                accessibilityLabel={item.label}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.space[3],
                  minHeight: minHitSize + 8,
                  paddingHorizontal: theme.space[4],
                  backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent',
                })}
              >
                <item.icon size={20} color={theme.colors.textSecondary} strokeWidth={1.75} />
                <Text style={{ flex: 1 }}>{item.label}</Text>
                <ChevronRight size={18} color={theme.colors.textTertiary} />
              </Pressable>
            </Link>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
