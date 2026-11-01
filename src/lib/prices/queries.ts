import { and, asc, eq, gte, inArray, max } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { addDays } from "../dates";
import { getDb } from "../db";
import { prices } from "../db/schema";
import { COMMODITIES, NATIONAL_ID } from "../reference";
import { computeChanges, type PriceChanges, type PricePoint } from "./calc";

/**
 * Query untuk halaman. Fungsi bertanda "use cache" di-prerender saat build (ISR) dan
 * di-revalidate lewat tag `prices` setelah cron selesai, jadi pengunjung tidak memicu query.
 */
export const PRICES_TAG = "prices";

/** Jumlah titik terakhir untuk sparkline di kartu dashboard (±1 bulan hari kerja). */
const SPARK_POINTS = 22;

export type DashboardItem = {
  commodityId: number;
  changes: PriceChanges | null;
  /** Harga beberapa hari data terakhir (urut naik) untuk sparkline. */
  spark: number[];
};

export type RegionDashboard = {
  /** Tanggal data terbaru untuk wilayah ini (null = belum ada data). */
  latestDate: string | null;
  source: string | null;
  items: DashboardItem[];
};

export async function getRegionDashboard(regionId: number): Promise<RegionDashboard> {
  "use cache";
  cacheLife("days");
  cacheTag(PRICES_TAG);

  const db = await getDb();
  const [{ latest }] = await db
    .select({ latest: max(prices.date) })
    .from(prices)
    .where(eq(prices.provinceId, regionId));
  if (!latest) {
    return {
      latestDate: null,
      source: null,
      items: COMMODITIES.map((c) => ({ commodityId: c.id, changes: null, spark: [] })),
    };
  }

  const rows = await db
    .select({ commodityId: prices.commodityId, date: prices.date, price: prices.price, source: prices.source })
    .from(prices)
    .where(and(eq(prices.provinceId, regionId), gte(prices.date, addDays(latest, -30))))
    .orderBy(asc(prices.date));

  const byCommodity = new Map<number, PricePoint[]>();
  for (const r of rows) {
    const list = byCommodity.get(r.commodityId) ?? [];
    list.push({ date: r.date, price: r.price });
    byCommodity.set(r.commodityId, list);
  }

  return {
    latestDate: latest,
    source: rows.at(-1)?.source ?? null,
    items: COMMODITIES.map((c) => {
      const series = byCommodity.get(c.id) ?? [];
      return {
        commodityId: c.id,
        changes: computeChanges(series),
        spark: series.slice(-SPARK_POINTS).map((p) => p.price),
      };
    }),
  };
}

export type CommodityDetail = {
  latestDate: string | null;
  source: string | null;
  /** Tanggal yang ada datanya (urut naik), mencakup ±95 hari terakhir. */
  dates: string[];
  /** Harga per tanggal (sejajar dengan `dates`; null = tidak ada laporan). */
  series: { regionId: number; prices: (number | null)[] }[];
  /** Provinsi yang punya harga pada `latestDate`, urut dari termahal. */
  ranking: { regionId: number; price: number }[];
};

export async function getCommodityDetail(commodityId: number): Promise<CommodityDetail> {
  "use cache";
  cacheLife("days");
  cacheTag(PRICES_TAG);

  const db = await getDb();
  const [{ latest }] = await db
    .select({ latest: max(prices.date) })
    .from(prices)
    .where(eq(prices.commodityId, commodityId));
  if (!latest) return { latestDate: null, source: null, dates: [], series: [], ranking: [] };

  const rows = await db
    .select({ provinceId: prices.provinceId, date: prices.date, price: prices.price, source: prices.source })
    .from(prices)
    .where(and(eq(prices.commodityId, commodityId), gte(prices.date, addDays(latest, -95))))
    .orderBy(asc(prices.date));

  const dates = [...new Set(rows.map((r) => r.date))];
  const dateIndex = new Map(dates.map((d, i) => [d, i]));
  const byRegion = new Map<number, (number | null)[]>();
  for (const r of rows) {
    let list = byRegion.get(r.provinceId);
    if (!list) {
      list = new Array<number | null>(dates.length).fill(null);
      byRegion.set(r.provinceId, list);
    }
    list[dateIndex.get(r.date)!] = r.price;
  }

  const lastIndex = dates.length - 1;
  const ranking = [...byRegion.entries()]
    .filter(([regionId, list]) => regionId !== NATIONAL_ID && list[lastIndex] !== null)
    .map(([regionId, list]) => ({ regionId, price: list[lastIndex] as number }))
    .sort((a, b) => b.price - a.price);

  return {
    latestDate: latest,
    source: rows.at(-1)?.source ?? null,
    dates,
    series: [...byRegion.entries()].map(([regionId, list]) => ({ regionId, prices: list })),
    ranking,
  };
}

/** Untuk unduhan CSV (tidak di-cache: parameternya bebas dari pengguna). */
export async function getPricesForExport(commodityId: number, regionIds: number[], startDate: string) {
  const db = await getDb();
  return db
    .select({ provinceId: prices.provinceId, date: prices.date, price: prices.price, source: prices.source })
    .from(prices)
    .where(and(eq(prices.commodityId, commodityId), inArray(prices.provinceId, regionIds), gte(prices.date, startDate)))
    .orderBy(asc(prices.date), asc(prices.provinceId));
}

/** Tanggal data terbaru di seluruh database (tidak di-cache). */
export async function getLatestDataDate(): Promise<string | null> {
  const db = await getDb();
  const [{ latest }] = await db.select({ latest: max(prices.date) }).from(prices);
  return latest ?? null;
}
