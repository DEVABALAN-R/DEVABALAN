import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { previewProfile } from '@/features/preview/notice';
import { greeting } from '@/lib/formatting/greeting';
import { useTheme } from '@/theme';
import { BrandMark } from './BrandMark';
import { ThemeToggle } from './ThemeToggle';

export function MobileHeader() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top + theme.space[2],
        paddingHorizontal: theme.space[4],
        paddingBottom: theme.space[2],
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space[3],
        backgroundColor: theme.colors.bg,
      }}
    >
      <BrandMark size={34} wordmark={false} />
      <View style={{ flex: 1 }}>
        <Text variant="caption" color="textSecondary">
          {greeting()}
        </Text>
        <Text variant="bodyStrong" numberOfLines={1}>
          {previewProfile.name}
        </Text>
      </View>
      <ThemeToggle />
    </View>
  );
}
