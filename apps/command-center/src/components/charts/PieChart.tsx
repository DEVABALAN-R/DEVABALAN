import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Path, Polyline, Text as SvgText } from 'react-native-svg';
import { useTween } from '@/hooks/useTween';
import { fontFamily, useTheme } from '@/theme';
import { pieLayout, sectorPath } from './pieLayout';
import { useChartSize } from './useChartSize';

export type PieSegment = { label: string; value: number; color: string };

type PieChartProps = {
  segments: PieSegment[];
  /** Text alternative: what the chart shows and its largest parts. */
  accessibilityLabel: string;
  /** Highlights one slice (e.g. the list row under the pointer). */
  activeLabel?: string | null;
  /** Pressing a slice (drill-down). The list beside the chart offers the same action accessibly. */
  onSelect?: (label: string) => void;
  /** Fixed height; omit to fill the parent (fit layouts). */
  height?: number;
};

const shorten = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

/**
 * Pie with callout labels (Money Manager's Stats chart). Narrow charts show
 * percentages only; the ranked list beside the chart carries the names.
 */
export function PieChart({
  segments,
  accessibilityLabel,
  activeLabel,
  onSelect,
  height,
}: PieChartProps) {
  const theme = useTheme();
  const { width, height: measured, onLayout } = useChartSize();
  const chartHeight = height ?? measured;
  const compact = width < 480;
  const progress = useTween(segments.map((segment) => segment.label).join('|'), 900);
  const layout = useMemo(
    () =>
      pieLayout(segments, {
        width,
        height: chartHeight,
        labelWidth: compact ? 40 : Math.min(130, width * 0.22),
        gap: compact ? 20 : 32,
      }),
    [segments, width, chartHeight, compact],
  );
  const { cx, cy, radius } = layout;
  const labelsOpacity = Math.max(0, (progress - 0.6) / 0.4);
  return (
    <View
      role="img"
      accessibilityLabel={accessibilityLabel}
      onLayout={onLayout}
      style={height ? { height } : { flex: 1, minHeight: 200 }}
    >
      {width > 0 && chartHeight > 0 && radius > 0 ? (
        <Svg width={width} height={chartHeight} aria-hidden>
          {layout.wedges.map((wedge, index) => {
            const segment = segments[index];
            const dimmed = !!activeLabel && activeLabel !== wedge.label;
            const lift = activeLabel === wedge.label ? 6 : 0;
            const shift = `translate(${Math.sin(wedge.mid) * lift} ${-Math.cos(wedge.mid) * lift})`;
            const press = onSelect ? () => onSelect(wedge.label) : undefined;
            return wedge.share >= 0.9999 ? (
              <Circle
                key={wedge.label}
                cx={cx}
                cy={cy}
                r={radius * progress}
                fill={segment.color}
                onPress={press}
              />
            ) : (
              <Path
                key={wedge.label}
                d={sectorPath(cx, cy, radius, wedge.start * progress, wedge.end * progress)}
                fill={segment.color}
                stroke={theme.colors.surface}
                strokeWidth={2}
                opacity={dimmed ? 0.35 : 1}
                transform={shift}
                onPress={press}
              />
            );
          })}
          <G opacity={labelsOpacity}>
            {layout.callouts.map((callout) => {
              const color = segments[callout.index].color;
              const right = callout.side === 'right';
              const end = callout.textX + (right ? -6 : 6);
              const percent = `${(callout.share * 100).toFixed(1)}%`;
              const dimmed = !!activeLabel && activeLabel !== callout.label;
              return (
                <G key={callout.label} opacity={dimmed ? 0.4 : 1}>
                  <Polyline
                    points={`${callout.anchor.x},${callout.anchor.y} ${callout.elbow.x},${callout.elbow.y} ${end},${callout.y}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.3}
                  />
                  <Circle cx={callout.anchor.x} cy={callout.anchor.y} r={2.4} fill={color} />
                  {compact ? (
                    <SvgText
                      x={callout.textX}
                      y={callout.y + 4}
                      fontSize={12}
                      fontFamily={fontFamily.semibold}
                      fill={theme.colors.textPrimary}
                      textAnchor={right ? 'start' : 'end'}
                    >
                      {percent}
                    </SvgText>
                  ) : (
                    <>
                      <SvgText
                        x={callout.textX}
                        y={callout.y - 2}
                        fontSize={12}
                        fontFamily={fontFamily.semibold}
                        fill={theme.colors.textPrimary}
                        textAnchor={right ? 'start' : 'end'}
                      >
                        {shorten(callout.label, 18)}
                      </SvgText>
                      <SvgText
                        x={callout.textX}
                        y={callout.y + 13}
                        fontSize={12}
                        fontFamily={fontFamily.regular}
                        fill={theme.colors.textSecondary}
                        textAnchor={right ? 'start' : 'end'}
                      >
                        {percent}
                      </SvgText>
                    </>
                  )}
                </G>
              );
            })}
          </G>
        </Svg>
      ) : null}
    </View>
  );
}
