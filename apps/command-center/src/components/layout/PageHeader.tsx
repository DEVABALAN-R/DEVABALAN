import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useTheme } from '@/theme';
import { Heading, Text } from '../ui/Text';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  const theme = useTheme();
  const { isMobile } = useBreakpoint();
  return (
    <View
      style={{
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'flex-end',
        justifyContent: 'space-between',
        gap: theme.space[4],
      }}
    >
      <View style={{ flex: 1, gap: theme.space[1] }}>
        {eyebrow ? (
          <Text variant="eyebrow" color="textSecondary" uppercase>
            {eyebrow}
          </Text>
        ) : null}
        <Heading level={1}>{title}</Heading>
        {description ? <Text color="textSecondary">{description}</Text> : null}
      </View>
      {actions ? (
        <View style={{ flexDirection: 'row', gap: theme.space[2], flexWrap: 'wrap' }}>
          {actions}
        </View>
      ) : null}
    </View>
  );
}
