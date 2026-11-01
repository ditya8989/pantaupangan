import { addDays } from "../dates";

export type PricePoint = { date: string; price: number };
export type Direction = "naik" | "turun" | "stabil";

/** Perubahan dengan nilai absolut di bawah ambang ini (persen) dianggap stabil. */
export const STABLE_THRESHOLD_PCT = 0.5;

/** Titik pembanding "7 hari lalu" tidak boleh lebih tua dari ini (hari kalender). */
const MAX_WEEK_LOOKBACK_DAYS = 14;

export type PriceDelta = {
  from: PricePoint;
  abs: number;
  pct: number;
  direction: Direction;
};

export type PriceChanges = {
  latest: PricePoint;
  /** Dibanding hari data sebelumnya (akhir pekan/libur otomatis terlewati). */
  vsPrevious: PriceDelta | null;
  /** Dibanding harga pada tanggal data terakhir yang ≤ (tanggal terbaru − 7 hari). */
  vsWeek: PriceDelta | null;
};

export function direction(pct: number): Direction {
  if (Math.abs(pct) < STABLE_THRESHOLD_PCT) return "stabil";
  return pct > 0 ? "naik" : "turun";
}

function delta(latest: PricePoint, from: PricePoint): PriceDelta {
  const abs = latest.price - from.price;
  // Kalikan dulu baru bagi: 12000 * 100 / 80000 tepat 15, sedangkan (12000 / 80000) * 100 = 15,000000000000002.
  const pct = from.price === 0 ? 0 : (abs * 100) / from.price;
  return { from, abs, pct, direction: direction(pct) };
}

/** Urutkan menurut tanggal dan buang tanggal ganda (yang terakhir menang). */
export function normalizeSeries(points: readonly PricePoint[]): PricePoint[] {
  const byDate = new Map<string, PricePoint>();
  for (const p of points) byDate.set(p.date, p);
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** Titik terakhir dengan tanggal ≤ target. `series` harus urut naik. */
export function lastOnOrBefore(series: readonly PricePoint[], target: string): PricePoint | null {
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i].date <= target) return series[i];
  }
  return null;
}

/** Hitung perubahan harga. `series` harus urut naik dan hanya berisi hari yang ada datanya. */
export function computeChanges(series: readonly PricePoint[]): PriceChanges | null {
  const latest = series.at(-1);
  if (!latest) return null;

  const previous = series.length > 1 ? series[series.length - 2] : null;
  const weekRef = lastOnOrBefore(series, addDays(latest.date, -7));
  const weekRefRecentEnough = weekRef !== null && weekRef.date >= addDays(latest.date, -MAX_WEEK_LOOKBACK_DAYS);

  return {
    latest,
    vsPrevious: previous ? delta(latest, previous) : null,
    vsWeek: weekRefRecentEnough ? delta(latest, weekRef) : null,
  };
}

export type PriceSummary = {
  max: PricePoint;
  min: PricePoint;
  avg: number;
  count: number;
};

export function summarize(points: readonly PricePoint[]): PriceSummary | null {
  if (points.length === 0) return null;
  let max = points[0];
  let min = points[0];
  let sum = 0;
  for (const p of points) {
    if (p.price > max.price) max = p;
    if (p.price < min.price) min = p;
    sum += p.price;
  }
  return { max, min, avg: Math.round(sum / points.length), count: points.length };
}
