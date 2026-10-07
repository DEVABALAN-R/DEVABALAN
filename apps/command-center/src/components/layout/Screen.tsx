import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { layout, useTheme } from '@/theme';

type ScreenProps = { children: ReactNode; scroll?: boolean };

/** Page canvas: responsive gutters, a max content width, and room for the bottom bar. */
export function Screen({ children, scroll = true }: ScreenProps) {
  const theme = useTheme();
  const { mode } = useBreakpoint();
  const gutter =
    mode === 'mobile' ? theme.space[4] : mode === 'tablet' ? theme.space[6] : theme.space[8];
  const content = (
    <View
      style={{
        width: '100%',
        maxWidth: layout.contentMaxWidth,
        alignSelf: 'center',
        paddingHorizontal: gutter,
        paddingTop: theme.space[mode === 'mobile' ? 4 : 6],
        paddingBottom:
          mode === 'mobile' ? layout.bottomBarHeight + theme.space[10] : theme.space[10],
        gap: theme.space[6],
      }}
    >
      {children}
    </View>
  );
  if (!scroll) return <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>{content}</View>;
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      keyboardShouldPersistTaps="handled"
    >
      {content}
    </ScrollView>
  );
}
