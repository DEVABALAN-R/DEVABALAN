import type { LucideIcon } from '@/components/icons';
import { Pressable, type PressableProps } from 'react-native';
import { useInteractionState } from '@/hooks/useInteractionState';
import { minHitSize, useTheme } from '@/theme';

type IconButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  icon: LucideIcon;
  /** Required: icon-only controls must be named for assistive tech. */
  accessibilityLabel: string;
  tone?: 'default' | 'accent' | 'danger';
  size?: 'sm' | 'md';
  selected?: boolean;
};

export function IconButton({
  icon: Icon,
  tone = 'default',
  size = 'md',
  selected = false,
  disabled,
  ...rest
}: IconButtonProps) {
  const theme = useTheme();
  const { hovered, focused, handlers } = useInteractionState();
  const box = size === 'sm' ? 36 : minHitSize;
  const iconColor =
    tone === 'accent' || selected
      ? theme.colors.accent
      : tone === 'danger'
        ? theme.colors.danger
        : theme.colors.textSecondary;

  return (
    <Pressable
      role="button"
      accessibilityState={{ disabled: !!disabled, selected }}
      disabled={disabled}
      hitSlop={(minHitSize - box) / 2}
      {...handlers}
      {...rest}
      style={({ pressed }) => [
        {
          width: box,
          height: box,
          borderRadius: theme.radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            pressed || hovered || selected ? theme.colors.surfaceMuted : 'transparent',
          opacity: disabled ? 0.5 : 1,
        },
        focused && { outlineColor: theme.colors.focus, outlineWidth: 2, outlineStyle: 'solid' },
      ]}
    >
      <Icon size={20} color={iconColor} strokeWidth={2} />
    </Pressable>
  );
}
