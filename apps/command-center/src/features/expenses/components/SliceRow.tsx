import { Pressable, View } from 'react-native';
import { ArrowLeftRight, ChevronRight } from '@/components/icons';
import { CategoryIcon, Text } from '@/components/ui';
import { useInteractionState } from '@/hooks/useInteractionState';
import { TRANSFER_FEES_ID, type Slice } from '@/lib/domain/expenses';
import { formatMoneyWhole } from '@/lib/formatting/currency';
import { useTheme } from '@/theme';
import { iconFor } from '../categoryIcons';

/** "34%" — shares under 1% read "<1%" rather than a misleading "0%". */
export function formatShare(share: number): string {
  if (share > 0 && share < 0.01) return '<1%';
  return `${Math.round(share * 100)}%`;
}

type SliceRowProps = {
  slice: Slice;
  color: string;
  /** Drill into the category; omitted for buckets that have no category. */
  onPress?: () => void;
  active?: boolean;
  onHover?: (id: string | null) => void;
};

/** Ranked category row: colour key, icon, name, share and amount. */
export function SliceRow({ slice, color, onPress, active = false, onHover }: SliceRowProps) {
  const theme = useTheme();
  const { hovered, focused, handlers } = useInteractionState();
  const neutral = !slice.category;
  const highlighted = active || hovered;
  return (
    <Pressable
      role={onPress ? 'button' : undefined}
      disabled={!onPress}
      accessibilityLabel={`${slice.name}: ${formatMoneyWhole(slice.amount)}, ${formatShare(slice.share)}, ${slice.count} ${slice.count === 1 ? 'entry' : 'entries'}`}
      onPress={onPress}
      onHoverIn={() => {
        handlers.onHoverIn();
        onHover?.(slice.name);
      }}
      onHoverOut={() => {
        handlers.onHoverOut();
        onHover?.(null);
      }}
      onFocus={handlers.onFocus}
      onBlur={handlers.onBlur}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space[3],
          paddingVertical: 6,
          paddingHorizontal: theme.space[2],
          borderRadius: theme.radius.md,
          backgroundColor: highlighted ? theme.colors.surfaceMuted : 'transparent',
        },
        focused && { outlineColor: theme.colors.focus, outlineWidth: 2, outlineStyle: 'solid' },
      ]}
    >
      <View
        aria-hidden
        style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: color }}
      />
      <CategoryIcon
        icon={slice.id === TRANSFER_FEES_ID ? ArrowLeftRight : iconFor(slice.category?.icon ?? '')}
        tint={slice.category?.tint ?? 0}
        colors={
          neutral ? { bg: theme.colors.surfaceMuted, fg: theme.colors.textSecondary } : undefined
        }
        size={32}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="label" numberOfLines={1}>
          {slice.name}
        </Text>
        <Text variant="caption" color="textTertiary" numberOfLines={1}>
          {slice.count} {slice.count === 1 ? 'entry' : 'entries'}
        </Text>
      </View>
      <View
        style={{
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.surfaceMuted,
        }}
      >
        <Text variant="caption" color="textSecondary" numeric>
          {formatShare(slice.share)}
        </Text>
      </View>
      <Text variant="label" numeric style={{ minWidth: 76, textAlign: 'right' }} numberOfLines={1}>
        {formatMoneyWhole(slice.amount)}
      </Text>
      {onPress ? <ChevronRight size={16} color={theme.colors.textTertiary} /> : null}
    </Pressable>
  );
}
