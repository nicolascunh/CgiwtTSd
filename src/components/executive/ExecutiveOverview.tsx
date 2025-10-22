import React, { useState } from 'react';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';

type Tone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

const toneColors: Record<Tone, { fg: string; bg: string }> = {
  info: { fg: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.12)' },
  success: { fg: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)' },
  warning: { fg: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' },
  danger: { fg: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  neutral: { fg: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' },
};

const NoDataState: React.FC<{ description?: string }> = ({
  description = 'Sem dados disponíveis para o período selecionado.',
}) => (
  <div className="flex min-h-[120px] flex-col items-center justify-center text-center text-sm text-slate-400">
    <span>{description}</span>
  </div>
);

const EmptyWidget: React.FC<{ title: string; className?: string }> = ({
  title,
  className = '',
}) => (
  <div
    className={`rounded-2xl border border-dashed border-slate-200 bg-white/90 p-5 text-center shadow-sm ${className}`}
  >
    <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
      {title}
    </div>
    <div className="mt-4 text-xs text-slate-400">
      Sem dados disponíveis para o período selecionado.
    </div>
  </div>
);

export interface TrendArrowProps {
  value: number;
  direction?: 'up' | 'down';
  suffix?: string;
  tone?: Tone;
}

export const TrendArrow: React.FC<TrendArrowProps> = ({
  value,
  direction,
  suffix = '',
  tone,
}) => {
  const effectiveDirection = direction ?? (value >= 0 ? 'up' : 'down');
  const effectiveTone: Tone =
    tone ??
    (effectiveDirection === 'up'
      ? 'success'
      : 'danger');
  const Icon = effectiveDirection === 'up' ? ArrowUpOutlined : ArrowDownOutlined;
  const formattedValue = `${effectiveDirection === 'up' ? '+' : '-'}${Math.abs(value)}${suffix}`;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{
        color: toneColors[effectiveTone].fg,
        background: toneColors[effectiveTone].bg,
      }}
    >
      <Icon />
      {formattedValue}
    </span>
  );
};

export interface StatusIndicatorProps {
  label: string;
  tone?: Tone;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  label,
  tone = 'info',
}) => (
  <span
    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide"
    style={{
      color: toneColors[tone].fg,
      background: toneColors[tone].bg,
    }}
  >
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ background: toneColors[tone].fg }}
    />
    {label}
  </span>
);

export interface KpiCardProps {
  title: string;
  value: string;
  helper?: string;
  trend?: React.ReactNode;
  comparisonLabel?: string;
  comparisonValue?: string;
  comparisonTrend?: React.ReactNode;
  comparisonDelta?: string;
  footnote?: string;
  miniChart?: React.ReactNode;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  helper,
  trend,
  comparisonLabel,
  comparisonValue,
  comparisonTrend,
  comparisonDelta,
  footnote,
  miniChart,
  className = '',
}) => (
  <div
    className={`rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm transition-colors hover:border-blue-200 hover:shadow-md ${className}`}
  >
    <div className="flex items-start justify-between">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>
    {trend}
    </div>
    <div className="mt-3 flex items-end justify-between gap-6">
      <div>
        <div className="text-2xl font-semibold text-slate-900 md:text-[28px]">
          {value}
        </div>
        {helper && (
          <div className="mt-1 text-[11px] text-slate-500">
            {helper}
          </div>
        )}
      </div>
      {comparisonValue && (
        <div className="text-right">
          {comparisonLabel && (
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {comparisonLabel}
            </div>
          )}
          <div className="mt-1 flex items-center justify-end gap-2">
            <div className="text-sm font-semibold text-slate-600">
              {comparisonValue}
            </div>
            {comparisonTrend}
          </div>
          {comparisonDelta && (
            <div className="mt-1 text-[11px] text-slate-500">
              {comparisonDelta}
            </div>
          )}
        </div>
      )}
    </div>
    {miniChart && (
      <div className="mt-4">{miniChart}</div>
    )}
    {footnote && (
      <div className="mt-4 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {footnote}
      </div>
    )}
  </div>
);

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
  hint?: string;
}

export interface DonutChartProps {
  title: string;
  subtitle?: string;
  centerPrimary: string;
  centerSecondary: string;
  segments: DonutSegment[];
  status?: React.ReactNode;
  valueFormatter?: (segment: DonutSegment, total: number) => string;
  className?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  title,
  subtitle,
  centerPrimary,
  centerSecondary,
  segments,
  status,
  valueFormatter = (segment, total) =>
    total > 0
      ? `${segment.value} (${((segment.value / total) * 100).toFixed(1)}%)`
      : `${segment.value}`,
  className = '',
}) => {
  const safeSegments = segments.map((segment) => ({
    ...segment,
    value: Number.isFinite(segment.value) ? Math.max(segment.value, 0) : 0,
  }));

  const total = safeSegments.reduce((acc, item) => acc + item.value, 0);
  const hasData = total > 0 && safeSegments.some((segment) => segment.value > 0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 14;
  const gapSize = Math.min(circumference * 0.01, 4);

  let cumulativeLength = 0;
  const segmentArcs = safeSegments.map((segment) => {
    const ratio = total > 0 ? segment.value / total : 0;
    const rawLength = ratio * circumference;
    const paintLength = Math.max(rawLength - gapSize, 0);
    const dashArray = `${paintLength} ${circumference}`;
    const dashOffset = -cumulativeLength;
    cumulativeLength += rawLength;

    return {
      ...segment,
      dashArray,
      dashOffset,
    };
  });

  const activeSegment =
    hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < safeSegments.length
      ? safeSegments[hoveredIndex]
      : null;
  const activePercentage =
    activeSegment && total > 0 ? (activeSegment.value / total) * 100 : 0;

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-700">{title}</div>
          {subtitle && (
            <div className="mt-1 text-xs text-slate-400">
              {subtitle}
            </div>
          )}
        </div>
        {status}
      </div>

      {hasData ? (
        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center">
          <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
            <svg
              width={140}
              height={140}
              viewBox="0 0 140 140"
              className="h-32 w-32"
            >
              <circle
                cx={70}
                cy={70}
                r={radius}
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth={strokeWidth}
              />
              <g transform="rotate(-90 70 70)">
                {segmentArcs.map((segment, index) => (
                  <circle
                    key={`segment-${segment.label}`}
                    cx={70}
                    cy={70}
                    r={radius}
                    fill="transparent"
                    stroke={segment.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={segment.dashArray}
                    strokeDashoffset={segment.dashOffset}
                    strokeLinecap="round"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onFocus={() => setHoveredIndex(index)}
                    onBlur={() => setHoveredIndex(null)}
                  />
                ))}
              </g>
            </svg>
            <div className="absolute flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
              <div className="text-lg font-semibold text-slate-900">
                {centerPrimary}
              </div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {centerSecondary}
              </div>
            </div>
            {activeSegment && (
              <div className="absolute left-1/2 top-full mt-4 w-max -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-center text-xs shadow-lg">
                <div className="font-semibold text-slate-700">{activeSegment.label}</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {valueFormatter(activeSegment, total)}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                  {activePercentage.toFixed(1)}%
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            {safeSegments.map((segment, index) => (
              <div
                key={segment.label}
                className="flex items-center justify-between text-sm text-slate-600"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: segment.color }}
                  />
                  <span className="font-medium text-slate-700">
                    {segment.label}
                  </span>
                  {segment.hint && (
                    <span className="text-xs text-slate-400">
                      {segment.hint}
                    </span>
                  )}
                </div>
                <div className="font-semibold text-slate-900">
                  {valueFormatter(segment, total)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <NoDataState />
        </div>
      )}
    </div>
  );
};

export interface HorizontalBarDatum {
  label: string;
  value: number;
  color: string;
  suffix?: string;
}

export interface HorizontalBarChartProps {
  title: string;
  subtitle?: string;
  data: HorizontalBarDatum[];
  className?: string;
}

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  title,
  subtitle,
  data,
  className = '',
}) => {
  const hasData = data.some((item) => item.value > 0);
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-700">{title}</div>
          {subtitle && (
            <div className="mt-1 text-xs text-slate-400">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {hasData ? (
        <div className="mt-5 space-y-4">
          {data.map((item, index) => (
            <div key={item.label}>
              <div
                className="flex items-center justify-between text-sm"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
              >
                <span className="flex items-center gap-2 text-slate-600">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: item.color }}
                  />
                  {item.label}
                </span>
                <span className="font-semibold text-slate-900">
                  {item.value}
                  {item.suffix ?? ''}
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    background: item.color,
                  }}
                />
              </div>
              {hoveredIndex === index && (
                <div className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow">
                  <div className="font-semibold text-slate-700">{item.label}</div>
                  <div>
                    {item.value}
                    {item.suffix ?? ''}
                  </div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">
                    {(maxValue > 0 ? ((item.value / maxValue) * 100).toFixed(1) : '0.0')}%
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <NoDataState />
        </div>
      )}
    </div>
  );
};

export interface VerticalBarDatum {
  label: string;
  value: number;
  color: string;
  suffix?: string;
}

export interface VerticalBarChartProps {
  title: string;
  subtitle?: string;
  data: VerticalBarDatum[];
  className?: string;
  maxValue?: number;
  showValue?: boolean;
}

export const VerticalBarChart: React.FC<VerticalBarChartProps> = ({
  title,
  subtitle,
  data,
  className = '',
  maxValue,
  showValue = true,
}) => {
  const hasData = data.some((item) => item.value > 0);
  const computedMax = maxValue ?? Math.max(...data.map((item) => item.value), 1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-700">{title}</div>
          {subtitle && (
            <div className="mt-1 text-xs text-slate-400">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {hasData ? (
        <div
          className="mt-5"
          style={{ overflowX: data.length > 6 ? 'auto' : 'visible' }}
        >
          <div
            className="flex items-end justify-start gap-3"
            style={{ minWidth: Math.max(320, data.length * 60) }}
          >
            {data.map((item, index) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-2 text-center"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
              >
                {showValue && (
                  <div
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{ background: `${item.color}20`, color: item.color }}
                  >
                    {item.value}
                    {item.suffix ?? ''}
                  </div>
                )}
                <div className="flex h-32 w-12 items-end justify-center rounded-lg bg-slate-100">
                  <div
                    className="w-full rounded-t-lg"
                    style={{
                      height: `${(item.value / computedMax) * 100}%`,
                      background: item.color,
                    }}
                  />
                </div>
                <div className="text-xs font-medium text-slate-500">
                  {item.label}
                </div>
                {hoveredIndex === index && (
                  <div className="mt-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 shadow">
                    <div className="font-semibold text-slate-700">{item.label}</div>
                    <div>
                      {item.value}
                      {item.suffix ?? ''}
                    </div>
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">
                      {(computedMax > 0 ? ((item.value / computedMax) * 100).toFixed(1) : '0.0')}%
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <NoDataState />
        </div>
      )}
    </div>
  );
};

export interface StackedColumnDatum {
  label: string;
  segments: { label: string; value: number; color: string }[];
}

export interface StackedColumnChartProps {
  title: string;
  subtitle?: string;
  data: StackedColumnDatum[];
  className?: string;
}

export const StackedColumnChart: React.FC<StackedColumnChartProps> = ({
  title,
  subtitle,
  data,
  className = '',
}) => {
  const totals = data.map((item) =>
    item.segments.reduce((sum, segment) => sum + Math.max(segment.value, 0), 0),
  );
  const maxValue = Math.max(...totals, 1);
  const hasData = totals.some((value) => value > 0);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<{ label: string; value: number; color: string } | null>(null);

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-700">{title}</div>
          {subtitle && (
            <div className="mt-1 text-xs text-slate-400">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {hasData ? (
        <div
          className="mt-5 overflow-x-auto pb-2"
        >
          <div
            className="flex items-end gap-4"
            style={{ minWidth: Math.max(360, data.length * 64) }}
          >
            {data.map((item, index) => {
              const total = totals[index];
              return (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-2 text-center"
                onMouseLeave={() => {
                  setHoveredKey(null);
                  setHoveredSegment(null);
                }}
              >
                <div className="flex h-40 w-12 flex-col justify-end overflow-hidden rounded-xl bg-slate-100">
                  {item.segments.map((segment) => {
                    const value = Math.max(segment.value, 0);
                    return (
                      <div
                        key={`${item.label}-${segment.label}`}
                        className="w-full"
                        style={{
                          height: `${(value / maxValue) * 100}%`,
                          background: segment.color,
                        }}
                        onMouseEnter={() => {
                          setHoveredKey(item.label);
                          setHoveredSegment({ ...segment, value });
                        }}
                        onFocus={() => {
                          setHoveredKey(item.label);
                          setHoveredSegment({ ...segment, value });
                        }}
                      />
                    );
                  })}
                </div>
                <div className="text-xs font-medium text-slate-500">
                  {item.label}
                </div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">
                  {total.toFixed(1)} h
                </div>
                {hoveredKey === item.label && hoveredSegment && (
                  <div className="mt-1 w-max rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow">
                    <div className="font-semibold" style={{ color: hoveredSegment.color }}>
                      {hoveredSegment.label}
                    </div>
                    <div>{hoveredSegment.value.toFixed(1)} h</div>
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">
                      {(maxValue > 0 ? ((hoveredSegment.value / maxValue) * 100).toFixed(1) : '0.0')}%
                    </div>
                  </div>
                )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <NoDataState />
        </div>
      )}
    </div>
  );
};

export interface TrendLineChartProps {
  title: string;
  subtitle?: string;
  points: number[];
  labels?: string[];
  className?: string;
  accentColor?: string;
  formatter?: (value: number) => string;
  yLabel?: string;
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  title,
  subtitle,
  points,
  labels,
  className = '',
  accentColor = '#3b82f6',
  formatter = (value) => value.toString(),
  yLabel,
}) => {
  const sanitizedPoints = points.map((point) =>
    Number.isFinite(point) ? point : 0,
  );
  const hasData = sanitizedPoints.some((value) => value > 0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxPoint = Math.max(...sanitizedPoints, 1);
  const minPoint = Math.min(...sanitizedPoints, 0);
  const diff = Math.max(maxPoint - minPoint, 1);

  const coordinates = sanitizedPoints
    .map((point, index) => {
      const x =
        sanitizedPoints.length === 1
          ? 0
          : (index / (sanitizedPoints.length - 1)) * 100;
      const y = 40 - ((point - minPoint) / diff) * 40;
      return `${x},${y}`;
    })
    .join(' ');

  const lastValue = sanitizedPoints[sanitizedPoints.length - 1] ?? 0;
  const hoveredValue = hoveredIndex !== null ? sanitizedPoints[hoveredIndex] : null;
  const chartPixelWidth = Math.max(320, sanitizedPoints.length * 28);
  const needsScroll = chartPixelWidth > 320;

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-700">{title}</div>
          {subtitle && (
            <div className="mt-1 text-xs text-slate-400">
              {subtitle}
            </div>
          )}
        </div>
        <div className="text-xl font-semibold text-slate-900">
          {formatter(lastValue)}
        </div>
      </div>

      {hasData ? (
        <>
          <div
            className="mt-4"
            style={{ overflowX: needsScroll ? 'auto' : 'visible' }}
          >
            <svg
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
              className="h-32"
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                width: chartPixelWidth,
                minWidth: chartPixelWidth,
              }}
            >
              <defs>
                <linearGradient id="trendArea" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={accentColor} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon
                points={`0,40 ${coordinates} 100,40`}
                fill="url(#trendArea)"
              />
              <polyline
                points={coordinates}
                fill="none"
                stroke={accentColor}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {hoveredIndex !== null && sanitizedPoints.length > 1 && (
                <>
                  <line
                    x1={(hoveredIndex / (sanitizedPoints.length - 1)) * 100}
                    x2={(hoveredIndex / (sanitizedPoints.length - 1)) * 100}
                    y1={0}
                    y2={40}
                    stroke={accentColor}
                    strokeDasharray="2 2"
                    strokeOpacity={0.4}
                  />
                  <circle
                    cx={(hoveredIndex / (sanitizedPoints.length - 1)) * 100}
                    cy={40 - ((sanitizedPoints[hoveredIndex] - minPoint) / diff) * 40}
                    r={1.8}
                    fill={accentColor}
                  />
                </>
              )}
            </svg>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              {yLabel ? (
                <span className="font-semibold uppercase tracking-wide text-slate-500">{yLabel}</span>
              ) : (
                <span />
              )}
              <span className="font-semibold uppercase tracking-wide text-slate-500">tempo</span>
            </div>
          </div>
          {labels && labels.length === sanitizedPoints.length && (
            <div className="mt-3 flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {labels.map((label, index) => (
                <span
                  key={label}
                  className={hoveredIndex === index ? 'text-slate-600 font-semibold' : undefined}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onFocus={() => setHoveredIndex(index)}
                >
                  {label}
                </span>
              ))}
            </div>
          )}
          {hoveredValue !== null && (
            <div className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow">
              <div className="font-semibold text-slate-700">
                {labels && hoveredIndex !== null ? labels[hoveredIndex] : 'Ponto'}
              </div>
              <div>{formatter(hoveredValue)}</div>
            </div>
          )}
        </>
      ) : (
        <div className="mt-5">
          <NoDataState />
        </div>
      )}
    </div>
  );
};

export interface SparklineProps {
  points: number[];
  color: string;
  fillOpacity?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  points,
  color,
  fillOpacity = 0.25,
}) => {
  const sanitizedPoints =
    points.length > 0 ? points : [0];
  const maxPoint = Math.max(...sanitizedPoints, 1);
  const minPoint = Math.min(...sanitizedPoints, 0);
  const diff = Math.max(maxPoint - minPoint, 1);
  const gradientId = `spark-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  const coordinates = sanitizedPoints
    .map((point, index) => {
      const x =
        sanitizedPoints.length === 1
          ? 0
          : (index / (sanitizedPoints.length - 1)) * 100;
      const y = 30 - ((point - minPoint) / diff) * 30;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      className="h-16 w-full"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,30 ${coordinates} 100,30`}
        fill={`url(#${gradientId})`}
      />
      <polyline
        points={coordinates}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export interface StackedHorizontalDatum {
  label: string;
  segments: { label: string; value: number; color: string }[];
}

export interface StackedHorizontalBarsProps {
  title: string;
  subtitle?: string;
  data: StackedHorizontalDatum[];
  className?: string;
}

export const StackedHorizontalBars: React.FC<StackedHorizontalBarsProps> = ({
  title,
  subtitle,
  data,
  className = '',
}) => {
  const totals = data.map((item) =>
    item.segments.reduce((sum, segment) => sum + Math.max(segment.value, 0), 0),
  );
  const maxValue = Math.max(...totals, 1);
  const hasData = totals.some((value) => value > 0);

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-700">{title}</div>
          {subtitle && (
            <div className="mt-1 text-xs text-slate-400">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {hasData ? (
        <div className="mt-5 space-y-4">
          {data.map((item, index) => {
            const total = totals[index];
            return (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span className="font-medium text-slate-700">
                    {item.label}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {total} eventos
                  </span>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  {item.segments.map((segment) => {
                    const value = Math.max(segment.value, 0);
                    return (
                      <div
                        key={`${item.label}-${segment.label}`}
                        style={{
                          width: `${(value / maxValue) * 100}%`,
                          background: segment.color,
                        }}
                        title={`${segment.label}: ${value}`}
                      />
                    );
                  })}
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {item.segments.map((segment) => (
                    <span
                      key={`${item.label}-${segment.label}-legend`}
                      className="inline-flex items-center gap-1"
                    >
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: segment.color }}
                      />
                      {segment.label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-5">
          <NoDataState />
        </div>
      )}
    </div>
  );
};

export interface ExecutiveOverviewProps {
  connection?: DonutChartProps;
  movement?: DonutChartProps;
  kpis?: KpiCardProps[];
  speedViolations?: DonutChartProps;
  tripDuration?: StackedColumnChartProps;
  distanceTrend?: TrendLineChartProps;
  driverEvents?: StackedHorizontalBarsProps;
  fuelDrains?: VerticalBarChartProps;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({
  connection,
  movement,
  kpis = [],
  speedViolations,
  tripDuration,
  distanceTrend,
  driverEvents,
  fuelDrains,
}) => (
  <div className="space-y-6">
    <div className="grid gap-6 md:grid-cols-2">
      {connection ? (
        <DonutChart {...connection} className="md:col-span-1" />
      ) : (
        <EmptyWidget title="Status de conexão" className="md:col-span-1" />
      )}
      {movement ? (
        <DonutChart {...movement} className="md:col-span-1" />
      ) : (
        <EmptyWidget title="Status de movimentação" className="md:col-span-1" />
      )}
    </div>

    {kpis.length > 0 ? (
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {kpis.map((card, index) => (
          <KpiCard
            key={`${card.title}-${index}`}
            {...card}
            className={card.className ?? ''}
          />
        ))}
      </div>
    ) : (
      <div className="grid gap-6">
        <EmptyWidget title="Indicadores principais" />
      </div>
    )}

    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
      {speedViolations ? (
        <DonutChart {...speedViolations} />
      ) : (
        <EmptyWidget title="Speed violations" />
      )}
      {tripDuration ? (
        <StackedColumnChart {...tripDuration} />
      ) : (
        <EmptyWidget title="Trip duration" />
      )}
      {distanceTrend ? (
        <TrendLineChart {...distanceTrend} />
      ) : (
        <EmptyWidget title="Total distance" />
      )}
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      {driverEvents ? (
        <StackedHorizontalBars {...driverEvents} />
      ) : (
        <EmptyWidget title="Top - 5 drivers by events" />
      )}
      {fuelDrains ? (
        <VerticalBarChart {...fuelDrains} />
      ) : (
        <EmptyWidget title="Fuel drains" />
      )}
    </div>
  </div>
);

export default ExecutiveOverview;
