import { Pressable, View } from 'react-native';

type HitColumnsProps = {
  count: number;
  left: number;
  width: number;
  onActive: (index: number | null) => void;
};

/**
 * Invisible equal-width columns over a chart: hover (web) or press (touch)
 * selects the nearest data point. Larger than the marks, per interaction spec.
 */
export function HitColumns({ count, left, width, onActive }: HitColumnsProps) {
  const columnWidth = count > 0 ? width / count : 0;
  return (
    <View style={{ position: 'absolute', top: 0, bottom: 0, left, width, flexDirection: 'row' }}>
      {Array.from({ length: count }, (_, index) => (
        <Pressable
          key={index}
          aria-hidden
          tabIndex={-1}
          style={{ width: columnWidth, height: '100%' }}
          onHoverIn={() => onActive(index)}
          onHoverOut={() => onActive(null)}
          onPressIn={() => onActive(index)}
        />
      ))}
    </View>
  );
}
