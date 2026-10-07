import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search } from '@/components/icons';
import { IconButton, Text } from '@/components/ui';
import { previewProfile } from '@/features/preview/notice';
import { greeting } from '@/lib/formatting/greeting';
import { useUiStore } from '@/state/ui';
import { useTheme } from '@/theme';
import { BrandMark } from './BrandMark';
import { ThemeToggle } from './ThemeToggle';

export function MobileHeader() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const openSearch = useUiStore((state) => state.openSearch);
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
      <BrandMark size={40} wordmark={false} />
      <View style={{ flex: 1 }}>
        <Text variant="caption" color="textSecondary">
          {greeting()}
        </Text>
        <Text variant="bodyStrong" numberOfLines={1}>
          {previewProfile.name}
        </Text>
      </View>
      <IconButton
        icon={Search}
        variant="surface"
        accessibilityLabel="Search"
        onPress={openSearch}
      />
      <ThemeToggle />
    </View>
  );
}
