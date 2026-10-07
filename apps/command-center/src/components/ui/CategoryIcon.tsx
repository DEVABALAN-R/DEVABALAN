import { View } from 'react-native';
import type { LucideIcon } from '../icons';
import { useTheme } from '@/theme';
import { Text } from './Text';

type CategoryIconProps = {
  icon: LucideIcon;
  /** Index into the theme's fixed tint list (wraps; categories keep their tint). */
  tint: number;
  size?: number;
};

/** Colourful tinted circle with an icon. Decorative: the row names the category. */
export function CategoryIcon({ icon: Icon, tint, size = 40 }: CategoryIconProps) {
  const theme = useTheme();
  const colors =
    theme.colors.tints[
      ((tint % theme.colors.tints.length) + theme.colors.tints.length) % theme.colors.tints.length
    ];
  return (
    <View
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={Math.round(size * 0.46)} color={colors.fg} strokeWidth={2} />
    </View>
  );
}

/** Initials avatar on the lime primary colour. */
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const theme = useTheme();
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  return (
    <View
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        variant="bodyStrong"
        color="onPrimary"
        style={{ fontSize: size * 0.38, lineHeight: size * 0.5 }}
      >
        {initials}
      </Text>
    </View>
  );
}
