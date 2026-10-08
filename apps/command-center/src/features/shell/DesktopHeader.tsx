import { View } from 'react-native';
import { ChevronDown, Search } from '@/components/icons';
import { Avatar, IconButton, Text } from '@/components/ui';
import { previewProfile } from '@/features/preview/notice';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useUiStore } from '@/state/ui';
import { layout, useTheme } from '@/theme';
import { BrandMark } from './BrandMark';
import { TopNav } from './TopNav';

/** Floating header for tablet and desktop: brand, primary nav, actions, profile. */
export function DesktopHeader() {
  const theme = useTheme();
  const { isDesktop } = useBreakpoint();
  const openSearch = useUiStore((state) => state.openSearch);
  const pill = {
    height: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
  } as const;
  return (
    <View
      style={{
        height: layout.headerHeight,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space[3],
        zIndex: 20,
      }}
    >
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={[pill, { paddingLeft: 5, paddingRight: isDesktop ? theme.space[5] : 5 }]}>
          <BrandMark wordmark={isDesktop} />
        </View>
      </View>
      <TopNav compact={!isDesktop} />
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: theme.space[2],
        }}
      >
        <View
          style={[
            pill,
            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 3, gap: 2 },
          ]}
        >
          <IconButton
            icon={Search}
            accessibilityLabel="Search"
            tooltip="top"
            onPress={openSearch}
          />
        </View>
        {isDesktop ? (
          <View
            style={[
              pill,
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.space[2],
                paddingLeft: 5,
                paddingRight: theme.space[3],
              },
            ]}
          >
            <Avatar name={previewProfile.name} size={40} />
            <View>
              <Text variant="label" numberOfLines={1}>
                {previewProfile.name}
              </Text>
              <Text variant="caption" color="textSecondary" numberOfLines={1}>
                {previewProfile.plan}
              </Text>
            </View>
            <ChevronDown size={16} color={theme.colors.textSecondary} />
          </View>
        ) : null}
      </View>
    </View>
  );
}
