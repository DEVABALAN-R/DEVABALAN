import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { smoothPath } from './scales';
import { useChartSize } from './useChartSize';

type SparklineProps = { values: number[]; color: string; height?: number; filled?: boolean };

/** Tiny decorative trend line; the surrounding text states the numbers. */
export function Sparkline({ values, color, height = 36, filled = true }: SparklineProps) {
  const { width, onLayout } = useChartSize();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const points = values.map((value, index) => ({
    x: index * step,
    y: 3 + (height - 6) * (1 - (value - min) / span),
  }));
  const line = smoothPath(points);
  return (
    <View aria-hidden onLayout={onLayout} style={{ height, alignSelf: 'stretch' }}>
      {width > 0 && values.length > 1 ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.28} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {filled ? (
            <Path d={`${line} L ${width} ${height} L 0 ${height} Z`} fill={`url(#s${id})`} />
          ) : null}
          <Path d={line} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
        </Svg>
      ) : null}
    </View>
  );
}
