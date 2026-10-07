import { Plus } from '@/components/icons';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@/components/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useUiStore } from '@/state/ui';
import { layout, useTheme } from '@/theme';
import { BrandIcon } from './navigation';
import { ThemeToggle } from './ThemeToggle';

export function TopBar() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isMobile } = useBreakpoint();
  const openQuickAdd = useUiStore((state) => state.openQuickAdd);
  return (
    <View
      style={{
        minHeight: layout.topBarHeight + (isMobile ? insets.top : 0),
        paddingTop: isMobile ? insets.top : 0,
        paddingHorizontal: theme.space[isMobile ? 4 : 8],
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space[2],
        backgroundColor: isMobile ? theme.colors.surface : theme.colors.bg,
        borderBottomWidth: isMobile ? 1 : 0,
        borderBottomColor: theme.colors.border,
      }}
    >
      {isMobile ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[2], flex: 1 }}>
          <View
            aria-hidden
            style={{
              width: 30,
              height: 30,
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BrandIcon size={17} color={theme.colors.onAccent} strokeWidth={2} />
          </View>
          <Text variant="bodyStrong">Devabalan</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {isMobile ? null : <Button label="Quick add" icon={Plus} size="sm" onPress={openQuickAdd} />}
      <ThemeToggle />
    </View>
  );
}
