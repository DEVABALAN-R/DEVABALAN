import { useId, useState } from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { useTween } from '@/hooks/useTween';
import { fontFamily, useTheme } from '@/theme';
import { ChartTooltip } from './ChartTooltip';
import { HitColumns } from './HitColumns';
import { niceMax, smoothPath, ticks } from './scales';
import { useChartSize } from './useChartSize';

type AreaChartProps = {
  labels: string[];
  values: number[];
  seriesName: string;
  color: string;
  /** Optional comparison drawn as a dashed line (e.g. amount invested). */
  compare?: { name: string; values: number[] };
  formatValue: (value: number) => string;
  formatAxis: (value: number) => string;
  accessibilityLabel: string;
  height?: number;
};

const AXIS = 44;
const BOTTOM = 22;
const TOP = 10;

export function AreaChart({
  labels,
  values,
  seriesName,
  color,
  compare,
  formatValue,
  formatAxis,
  accessibilityLabel,
  height,
}: AreaChartProps) {
  const theme = useTheme();
  const { width, height: measured, onLayout } = useChartSize();
  const [active, setActive] = useState<number | null>(null);
  const progress = useTween(values.length + (values[values.length - 1] ?? 0), 1100);
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const chartHeight = height ?? measured;
  const plotWidth = Math.max(0, width - AXIS - 8);
  const plotHeight = Math.max(0, chartHeight - BOTTOM - TOP);
  const max = niceMax(Math.max(1, ...values, ...(compare?.values ?? [])));
  const step = values.length > 1 ? plotWidth / (values.length - 1) : 0;
  const x = (index: number) => AXIS + index * step;
  const y = (value: number) => TOP + plotHeight - (value / max) * plotHeight;
  const points = values.map((value, index) => ({ x: x(index), y: y(value) }));
  const line = smoothPath(points);
  const area = points.length
    ? `${line} L ${x(values.length - 1)} ${TOP + plotHeight} L ${AXIS} ${TOP + plotHeight} Z`
    : '';
  const comparePath = compare
    ? smoothPath(compare.values.map((value, index) => ({ x: x(index), y: y(value) })))
    : '';
  const labelEvery = Math.max(1, Math.ceil(labels.length / 7));

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      onLayout={onLayout}
      style={height ? { height } : { flex: 1, minHeight: 140 }}
    >
      {width > 0 && chartHeight > 0 && values.length > 1 ? (
        <Svg width={width} height={chartHeight} aria-hidden>
          <Defs>
            <LinearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.35} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
            <ClipPath id={`c${id}`}>
              <Rect x={0} y={0} width={AXIS + plotWidth * progress + 4} height={chartHeight} />
            </ClipPath>
          </Defs>
          {ticks(max).map((tick) => (
            <G key={tick}>
              <Line
                x1={AXIS}
                x2={width}
                y1={y(tick)}
                y2={y(tick)}
                stroke={theme.colors.chartGrid}
                strokeDasharray="4 4"
              />
              <SvgText
                x={0}
                y={y(tick) + 4}
                fontSize={11}
                fontFamily={fontFamily.regular}
                fill={theme.colors.textTertiary}
              >
                {formatAxis(tick)}
              </SvgText>
            </G>
          ))}
          <G clipPath={`url(#c${id})`}>
            <Path d={area} fill={`url(#a${id})`} />
            {compare ? (
              <Path
                d={comparePath}
                stroke={theme.colors.textTertiary}
                strokeWidth={1.5}
                strokeDasharray="5 5"
                fill="none"
              />
            ) : null}
            <Path d={line} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          </G>
          {labels.map((label, index) =>
            index % labelEvery === 0 || index === labels.length - 1 ? (
              <SvgText
                key={`${label}-${index}`}
                x={x(index)}
                y={chartHeight - 4}
                fontSize={11}
                fontFamily={fontFamily.regular}
                fill={theme.colors.textTertiary}
                textAnchor={index === 0 ? 'start' : index === labels.length - 1 ? 'end' : 'middle'}
              >
                {label}
              </SvgText>
            ) : null,
          )}
          {active !== null ? (
            <G>
              <Line
                x1={x(active)}
                x2={x(active)}
                y1={TOP}
                y2={TOP + plotHeight}
                stroke={theme.colors.borderStrong}
                strokeDasharray="3 3"
              />
              <Circle
                cx={x(active)}
                cy={y(values[active])}
                r={6}
                fill={theme.colors.surface}
                stroke={color}
                strokeWidth={3}
              />
            </G>
          ) : null}
        </Svg>
      ) : null}
      <HitColumns
        count={values.length}
        left={AXIS - step / 2}
        width={plotWidth + step}
        onActive={setActive}
      />
      {active !== null ? (
        <ChartTooltip
          x={x(active)}
          containerWidth={width}
          title={labels[active] ?? ''}
          rows={[
            { label: seriesName, value: formatValue(values[active]), color },
            ...(compare
              ? [
                  {
                    label: compare.name,
                    value: formatValue(compare.values[active] ?? 0),
                    color: theme.colors.textTertiary,
                  },
                ]
              : []),
          ]}
        />
      ) : null}
    </View>
  );
}
