import { Pressable, View } from 'react-native';
import { useInteractionState } from '@/hooks/useInteractionState';
import { useTheme, type ColorRoles } from '@/theme';
import { Text } from './Text';

type SegmentTone = Extract<
  keyof ColorRoles,
  'accent' | 'income' | 'expense' | 'transfer' | 'investment'
>;

export type Segment<T extends string> = { value: T; label: string; tone?: SegmentTone };

type SegmentedControlProps<T extends string> = {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

/**
 * Mutually exclusive choice (e.g. Income · Expense · Transfer). The selected
 * segment is outlined and tinted with its semantic colour and also exposed as
 * `checked` to assistive tech.
 */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  return (
    <View
      role="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={{ flexDirection: 'row', gap: theme.space[2] }}
    >
      {segments.map((segment) => (
        <SegmentButton
          key={segment.value}
          segment={segment}
          selected={segment.value === value}
          onPress={() => onChange(segment.value)}
        />
      ))}
    </View>
  );
}

function SegmentButton<T extends string>({
  segment,
  selected,
  onPress,
}: {
  segment: Segment<T>;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { hovered, focused, handlers } = useInteractionState();
  const tone = segment.tone ?? 'accent';
  return (
    <Pressable
      role="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      {...handlers}
      style={[
        {
          flex: 1,
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: theme.space[3],
          borderRadius: theme.radius.md,
          borderWidth: selected ? 1.5 : 1,
          borderColor: selected ? theme.colors[tone] : theme.colors.border,
          backgroundColor: hovered && !selected ? theme.colors.surfaceMuted : theme.colors.surface,
        },
        focused && { outlineColor: theme.colors.focus, outlineWidth: 2, outlineStyle: 'solid' },
      ]}
    >
      <Text variant={selected ? 'bodyStrong' : 'body'} color={selected ? tone : 'textSecondary'}>
        {segment.label}
      </Text>
    </Pressable>
  );
}
