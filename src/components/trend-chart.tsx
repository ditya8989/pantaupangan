"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type DotItemDotProps,
  type TooltipContentProps,
} from "recharts";
import { formatDateId, formatDateShortId } from "@/lib/dates";
import { formatDecimal, formatNumber, formatRupiah } from "@/lib/format";

/**
 * Palet kategorikal 3 slot (biru, oranye, aqua), divalidasi untuk buta warna di mode terang & gelap.
 * Warna mengikuti wilayah (slot), bukan urutan, supaya tidak berganti saat pembanding ditambah/dihapus.
 */
export const SERIES_COLORS = {
  light: ["#2a78d6", "#eb6834", "#1baf7a"],
  dark: ["#3987e5", "#d95926", "#199e70"],
} as const;

const CHROME = {
  light: { surface: "#fcfcfb", text: "#181713", muted: "#6f6d66", grid: "#e1e0d9", axis: "#c3c2b7" },
  dark: { surface: "#1a1a19", text: "#f0efec", muted: "#a19f96", grid: "#2c2c2a", axis: "#383835" },
} as const;

const DARK_QUERY = "(prefers-color-scheme: dark)";
const subscribeColorScheme = (onChange: () => void) => {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

export function usePrefersDark(): boolean {
  return useSyncExternalStore(
    subscribeColorScheme,
    () => window.matchMedia(DARK_QUERY).matches,
    () => false,
  );
}

const subscribeNothing = () => () => {};
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribeNothing, () => true, () => false);
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

/** true jika pengguna meminta animasi dikurangi (default true di server agar aman). */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => true,
  );
}

export type ChartSeries = {
  key: string;
  name: string;
  slot: number;
  /** Sejajar dengan `dates`; null = tidak ada data hari itu. */
  values: (number | null)[];
};

type Props = {
  dates: string[];
  series: ChartSeries[];
  height?: number;
  ariaLabel: string;
};

const MARGIN = { top: 24, right: 12, bottom: 4, left: 4 };
const X_AXIS_HEIGHT = 24;
/** Tinggi teks label ujung (px) dan jarak ke titik ujung. */
const LABEL_HEIGHT = 12;
const LABEL_BELOW = 18;
const LABEL_ABOVE = -10;
/** Radius titik ujung + cincin permukaan. */
const END_DOT_REACH = 8;

/** Tick sumbu-Y yang "bulat" (1/2/2,5/5 × 10^n). */
function niceTicks(min: number, max: number, count = 4): number[] {
  let lo = min;
  let hi = max;
  if (lo === hi) {
    lo = lo * 0.95;
    hi = hi * 1.05;
  }
  const rawStep = (hi - lo) / count;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10) * magnitude;
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Math.round(v));
  return ticks;
}

/** 96500 → "96,5 rb"; 950 → "950". Spasi tak-putus agar tick tidak terpecah dua baris. */
function formatAxisRupiah(value: number): string {
  if (Math.abs(value) < 10_000) return formatNumber(value);
  const thousands = value / 1000;
  return `${formatDecimal(thousands, Number.isInteger(thousands) ? 0 : 1)} rb`;
}

function lastValidIndex(values: (number | null)[]): number {
  for (let i = values.length - 1; i >= 0; i--) if (values[i] !== null) return i;
  return -1;
}

export function TrendChart({ dates, series, height = 280, ariaLabel }: Props) {
  const dark = usePrefersDark();
  const isClient = useIsClient();
  const reducedMotion = usePrefersReducedMotion();
  const mode = dark ? "dark" : "light";
  const chrome = CHROME[mode];
  const palette = SERIES_COLORS[mode];

  const allValues = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  if (allValues.length === 0) {
    return (
      <div style={{ height }} className="grid place-items-center rounded-xl bg-surface-2/50 text-sm text-muted">
        Tidak ada data pada rentang ini.
      </div>
    );
  }

  const ticks = niceTicks(Math.min(...allValues), Math.max(...allValues));
  const domain: [number, number] = [ticks[0], ticks[ticks.length - 1]];

  const rows = dates.map((date, i) => {
    const row: Record<string, string | number | null> = { date };
    for (const s of series) row[s.key] = s.values[i];
    return row;
  });

  // Label nilai di ujung garis. Posisi: di bawah titik jika garis turun ke ujung (garis datang dari atas),
  // di atas jika naik; dibalik bila keluar area plot. Jika ada label yang menabrak label lain atau titik ujung
  // seri lain, semua label disembunyikan dan nilainya dibawa legenda + tooltip.
  const plotHeight = height - MARGIN.top - MARGIN.bottom - X_AXIS_HEIGHT;
  const ends = series.map((s) => {
    const index = lastValidIndex(s.values);
    if (index < 0) return { key: s.key, index, y: null, offset: 0 };
    const value = s.values[index] as number;
    const previous = s.values.slice(0, index).findLast((v) => v !== null) ?? null;
    const y = ((domain[1] - value) / (domain[1] - domain[0])) * plotHeight;
    const fitsBelow = y + LABEL_BELOW <= plotHeight - 2;
    const fitsAbove = y + LABEL_ABOVE - LABEL_HEIGHT >= -MARGIN.top + 2;
    const preferBelow = previous !== null && value < previous;
    const offset = preferBelow ? (fitsBelow ? LABEL_BELOW : LABEL_ABOVE) : fitsAbove ? LABEL_ABOVE : LABEL_BELOW;
    return { key: s.key, index, y, offset };
  });
  const labelSpan = (e: (typeof ends)[number]) => {
    const baseline = (e.y as number) + e.offset;
    return [baseline - LABEL_HEIGHT, baseline + 3] as const;
  };
  const showEndLabels = ends.every((a, i) =>
    ends.every((b, j) => {
      if (i === j || a.y === null || b.y === null) return true;
      const [top, bottom] = labelSpan(a);
      const [otherTop, otherBottom] = labelSpan(b);
      const hitsLabel = top < otherBottom && otherTop < bottom;
      const hitsDot = top < b.y + END_DOT_REACH && bottom > b.y - END_DOT_REACH;
      return !hitsLabel && !hitsDot;
    }),
  );

  const nameByKey = new Map(series.map((s) => [s.key, s.name]));

  return (
    <figure className="m-0" aria-label={ariaLabel} style={{ height }}>
      {isClient ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={MARGIN} accessibilityLayer>
            <CartesianGrid vertical={false} stroke={chrome.grid} strokeWidth={1} />
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => formatDateShortId(d)}
              tick={{ fill: chrome.muted, fontSize: 11 }}
              axisLine={{ stroke: chrome.axis }}
              tickLine={false}
              minTickGap={28}
              interval="preserveStartEnd"
              height={X_AXIS_HEIGHT}
            />
            <YAxis
              domain={domain}
              ticks={ticks}
              tickFormatter={formatAxisRupiah}
              tick={{ fill: chrome.muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={58}
            />
            <Tooltip
              cursor={{ stroke: chrome.muted, strokeWidth: 1 }}
              content={(props: TooltipContentProps) => (
                <ChartTooltip {...props} series={series} palette={palette} nameByKey={nameByKey} />
              )}
              isAnimationActive={false}
            />
            {series.map((s) => {
              const end = ends.find((e) => e.key === s.key)!;
              const color = palette[s.slot % palette.length];
              return (
                <Line
                  key={s.key}
                  dataKey={s.key}
                  name={s.name}
                  type="monotone"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  connectNulls
                  isAnimationActive={!reducedMotion}
                  animationDuration={1100}
                  animationEasing="ease-out"
                  activeDot={{ r: 5, strokeWidth: 2, stroke: chrome.surface, fill: color }}
                  dot={(props: DotItemDotProps): ReactNode =>
                    props.index === end.index && props.cx != null && props.cy != null ? (
                      <circle
                        key={`end-${s.key}`}
                        cx={props.cx}
                        cy={props.cy}
                        r={4.5}
                        fill={color}
                        stroke={chrome.surface}
                        strokeWidth={2}
                      />
                    ) : null
                  }
                  label={
                    showEndLabels
                      ? (props: { x?: number | string; y?: number | string; index?: number; value?: unknown }) =>
                          props.index === end.index && typeof props.value === "number" ? (
                            <text
                              key={`label-${s.key}`}
                              x={Number(props.x) - 8}
                              y={Number(props.y) + end.offset}
                              textAnchor="end"
                              fontSize={12}
                              fontWeight={600}
                              fill={chrome.text}
                              stroke={chrome.surface}
                              strokeWidth={4}
                              paintOrder="stroke"
                            >
                              {formatRupiah(props.value)}
                            </text>
                          ) : null
                      : false
                  }
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      ) : null}
    </figure>
  );
}

type TooltipExtras = {
  series: ChartSeries[];
  palette: readonly string[];
  nameByKey: Map<string, string>;
};

function ChartTooltip({ active, label, payload, series, palette }: TooltipContentProps & TooltipExtras) {
  if (!active || typeof label !== "string") return null;
  const valueByKey = new Map((payload ?? []).map((p) => [String(p.dataKey), p.value]));
  return (
    <div className="min-w-44 rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-md">
      <p className="mb-1 text-xs font-medium text-muted">{formatDateId(label)}</p>
      <ul className="space-y-1">
        {series.map((s) => {
          const value = valueByKey.get(s.key);
          return (
            <li key={s.key} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-0.5 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: palette[s.slot % palette.length] }}
              />
              <span className="font-semibold tabular-nums text-fg">
                {typeof value === "number" ? formatRupiah(value) : "—"}
              </span>
              <span className="truncate text-fg-2">{s.name}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
