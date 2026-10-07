import { Pressable, View } from 'react-native';
import Svg, { Circle, G, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { fontFamily, useTheme } from '@/theme';
import { useChartSize } from './useChartSize';

export type TrendPoint = {
  label: string;
  /** Second line under the label (e.g. the year under January). */
  sublabel?: string;
  value: number;
  /** Name read out for the point's button, e.g. "December 2025". */
  name: string;
};

type TrendLineChartProps = {
  points: TrendPoint[];
  color: string;
  /** Index of the highlighted point (the period on screen). */
  selected?: number;
  formatValue: (value: number) => string;
  /** Pressing a point; each point is also a labelled button. */
  onSelect?: (index: number) => void;
  accessibilityLabel: string;
  height?: number;
};

const TOP = 24;
const BOTTOM = 40;

/**
 * Money Manager's category trend: one line across months with the value over
 * each point and the selected month ringed; pressing a month opens it.
 */
export function TrendLineChart({
  points,
  color,
  selected,
  formatValue,
  onSelect,
  accessibilityLabel,
  height = 170,
}: TrendLineChartProps) {
  const theme = useTheme();
  const { width, onLayout } = useChartSize();
  const step = points.length ? width / points.length : 0;
  const values = points.map((point) => point.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const plot = height - TOP - BOTTOM;
  const x = (index: number) => step * (index + 0.5);
  const y = (value: number) => TOP + (1 - (value - min) / (max - min || 1)) * plot;
  const labelY = height - BOTTOM + 18;
  return (
    <View role="img" accessibilityLabel={accessibilityLabel} onLayout={onLayout} style={{ height }}>
      {width > 0 ? (
        <Svg width={width} height={height} aria-hidden>
          {[0, 0.5, 1].map((share) => (
            <Line
              key={share}
              x1={0}
              x2={width}
              y1={TOP + share * plot}
              y2={TOP + share * plot}
              stroke={theme.colors.chartGrid}
              strokeWidth={1}
            />
          ))}
          {points.map((point, index) => (
            <Line
              key={point.name}
              x1={x(index)}
              x2={x(index)}
              y1={TOP - 8}
              y2={TOP + plot}
              stroke={theme.colors.chartGrid}
              strokeWidth={1}
            />
          ))}
          <Polyline
            points={points.map((point, index) => `${x(index)},${y(point.value)}`).join(' ')}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          {points.map((point, index) => {
            const active = index === selected;
            const text = active ? theme.colors.textPrimary : theme.colors.textSecondary;
            return (
              <G key={point.name}>
                <Circle
                  cx={x(index)}
                  cy={y(point.value)}
                  r={active ? 5 : 4}
                  fill={active ? theme.colors.surface : color}
                  stroke={color}
                  strokeWidth={active ? 2.5 : 0}
                />
                <SvgText
                  x={x(index)}
                  y={y(point.value) - 10}
                  fontSize={10}
                  fontFamily={active ? fontFamily.semibold : fontFamily.regular}
                  fill={text}
                  textAnchor="middle"
                >
                  {formatValue(point.value)}
                </SvgText>
                <SvgText
                  x={x(index)}
                  y={labelY}
                  fontSize={12}
                  fontFamily={active ? fontFamily.semibold : fontFamily.regular}
                  fill={text}
                  textAnchor="middle"
                >
                  {point.label}
                </SvgText>
                {point.sublabel ? (
                  <SvgText
                    x={x(index)}
                    y={labelY + 14}
                    fontSize={10}
                    fontFamily={fontFamily.regular}
                    fill={theme.colors.textTertiary}
                    textAnchor="middle"
                  >
                    {point.sublabel}
                  </SvgText>
                ) : null}
              </G>
            );
          })}
        </Svg>
      ) : null}
      {onSelect && width > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            flexDirection: 'row',
          }}
        >
          {points.map((point, index) => (
            <Pressable
              key={point.name}
              role="button"
              accessibilityLabel={`Show ${point.name}: ${formatValue(point.value)}`}
              accessibilityState={{ selected: index === selected }}
              onPress={() => onSelect(index)}
              style={{ width: step, height: '100%' }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
