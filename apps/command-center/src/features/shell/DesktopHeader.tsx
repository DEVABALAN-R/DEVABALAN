import { View } from 'react-native';
import { ChevronDown } from '@/components/icons';
import { Avatar, Text } from '@/components/ui';
import { previewProfile } from '@/features/preview/notice';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { layout, useTheme } from '@/theme';
import { BrandMark } from './BrandMark';
import { TopNav } from './TopNav';

/** Floating header for tablet and desktop: brand, primary nav, actions, profile. */
export function DesktopHeader() {
  const theme = useTheme();
  const { isDesktop } = useBreakpoint();
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
