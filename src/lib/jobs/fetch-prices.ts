import { and, desc, eq, lt, max, sql } from "drizzle-orm";
import { evaluateAndSendAlerts, type AlertRunSummary } from "../alerts/service";
import { todayInJakarta } from "../dates";
import { getDb, type Db } from "../db";
import { fetchLogs, prices } from "../db/schema";
import { ensureReferenceData } from "../db/seed";
import { sendEmail } from "../email";
import { developerFailureEmail } from "../email/templates";
import { COMMODITIES, NATIONAL_ID, findCommodityBySourceCode, provinceIdFromSourceName } from "../reference";
import { getSource } from "../sources";
import type { PriceRecord, PriceSource } from "../sources/types";
import { computeWindowStart, stalestFirst } from "./window";

/**
 * Job harian (dipanggil cron): ambil data per komoditas, upsert ke `prices`, catat ke `fetch_logs`,
 * lalu evaluasi alert. Modul ini sengaja tidak memakai API Next.js supaya bisa dipakai di mana saja;
 * revalidasi cache dilakukan oleh pemanggil.
 */

export type FetchJobOptions = {
  now?: Date;
  /** Berhenti memproses komoditas berikutnya setelah waktu ini habis (untuk batas durasi fungsi). */
  timeBudgetMs?: number;
  source?: PriceSource;
};

export type FetchJobResult = {
  logId: number;
  source: string;
  status: "success" | "partial" | "error";
  /** false jika masih ada komoditas yang belum diproses karena batas waktu; jalankan lagi. */
  done: boolean;
  rowsUpserted: number;
  latestDataDate: string | null;
  processed: string[];
  pending: string[];
  failed: { commodity: string; error: string }[];
  warnings: string[];
  alerts: AlertRunSummary | { error: string } | null;
  durationMs: number;
};

const UPSERT_CHUNK = 1_000;
/** Run berstatus "running" lebih lama dari ini dianggap terhenti (mis. kena timeout fungsi). */
const STALE_RUN_MINUTES = 15;

type PriceRow = typeof prices.$inferInsert;

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

function toRows(records: readonly PriceRecord[], sourceName: string, warnings: string[]): PriceRow[] {
  const byKey = new Map<string, PriceRow>();
  const unknown = new Set<string>();
  for (const r of records) {
    const commodity = findCommodityBySourceCode(r.commodityCode);
    if (!commodity) {
      unknown.add(`komoditas "${r.commodityCode}"`);
      continue;
    }
    const provinceId = r.provinceName === null ? NATIONAL_ID : provinceIdFromSourceName(r.provinceName);
    if (provinceId === undefined) {
      unknown.add(`provinsi "${r.provinceName}"`);
      continue;
    }
    // Kunci unik sama dengan constraint DB; duplikat dalam satu INSERT ... ON CONFLICT akan error.
    byKey.set(`${commodity.id}:${provinceId}:${r.date}`, {
      commodityId: commodity.id,
      provinceId,
      date: r.date,
      price: r.price,
      source: sourceName,
    });
  }
  for (const item of unknown) warnings.push(`Tidak dikenal, dilewati: ${item}`);
  return [...byKey.values()];
}

async function upsertPrices(db: Db, rows: PriceRow[]): Promise<number> {
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    await db
      .insert(prices)
      .values(rows.slice(i, i + UPSERT_CHUNK))
      .onConflictDoUpdate({
        target: [prices.commodityId, prices.provinceId, prices.date],
        set: { price: sql`excluded.price`, source: sql`excluded.source` },
      });
  }
  return rows.length;
}

async function markStaleRuns(db: Db): Promise<void> {
  await db
    .update(fetchLogs)
    .set({ status: "error", finishedAt: new Date(), error: "Run terhenti sebelum selesai (kemungkinan timeout)." })
    .where(
      and(
        eq(fetchLogs.status, "running"),
        lt(fetchLogs.startedAt, sql`now() - ${STALE_RUN_MINUTES}::int * interval '1 minute'`),
      ),
    );
}

async function notifyDeveloperIfRepeatedFailure(db: Db, logId: number, errors: string): Promise<void> {
  const to = process.env.ALERT_DEV_EMAIL;
  if (!to) return;
  const [previous] = await db
    .select({ status: fetchLogs.status })
    .from(fetchLogs)
    .where(lt(fetchLogs.id, logId))
    .orderBy(desc(fetchLogs.id))
    .limit(1);
  if (previous?.status !== "error") return;
  try {
    await sendEmail(developerFailureEmail(to, { errors, logId }));
  } catch (error) {
    console.error("[fetch-prices] gagal mengirim email ke developer:", error);
  }
}

export async function runFetchJob(options: FetchJobOptions = {}): Promise<FetchJobResult> {
  const startedAt = Date.now();
  const now = options.now ?? new Date();
  const budgetMs = options.timeBudgetMs ?? Number.POSITIVE_INFINITY;
  const source = options.source ?? getSource();
  const today = todayInJakarta(now);

  const db = await getDb();
  await ensureReferenceData(db);
  await markStaleRuns(db);
  const [log] = await db
    .insert(fetchLogs)
    .values({ source: source.name, status: "running" })
    .returning({ id: fetchLogs.id });

  const latestRows = await db
    .select({ commodityId: prices.commodityId, latest: max(prices.date) })
    .from(prices)
    .groupBy(prices.commodityId);
  const latestByCommodity = new Map(latestRows.map((r) => [r.commodityId, r.latest]));

  const processed: string[] = [];
  const pending: string[] = [];
  const failed: { commodity: string; error: string }[] = [];
  const warnings: string[] = [];
  let rowsUpserted = 0;

  for (const commodity of stalestFirst(COMMODITIES, latestByCommodity)) {
    if (Date.now() - startedAt > budgetMs) {
      pending.push(commodity.slug);
      continue;
    }
    const startDate = computeWindowStart(today, latestByCommodity.get(commodity.id) ?? null);
    try {
      const result = await source.fetchPrices({ startDate, endDate: today, commodityCodes: [commodity.sourceCode] });
      warnings.push(...result.warnings);
      rowsUpserted += await upsertPrices(db, toRows(result.records, source.name, warnings));
      processed.push(commodity.slug);
    } catch (error) {
      failed.push({ commodity: commodity.slug, error: errorMessage(error) });
    }
  }

  const status: FetchJobResult["status"] =
    processed.length === 0 && failed.length > 0 ? "error" : failed.length > 0 || pending.length > 0 ? "partial" : "success";
  const errorText = failed.length > 0 ? failed.map((f) => `${f.commodity}: ${f.error}`).join("\n") : null;
  const uniqueWarnings = [...new Set(warnings)];

  const [{ latest }] = await db.select({ latest: max(prices.date) }).from(prices);
  await db
    .update(fetchLogs)
    .set({
      finishedAt: new Date(),
      status,
      rowsUpserted,
      latestDataDate: latest ?? null,
      error: errorText,
      warnings: uniqueWarnings.length > 0 ? uniqueWarnings.join("\n") : null,
    })
    .where(eq(fetchLogs.id, log.id));

  let alertSummary: FetchJobResult["alerts"] = null;
  if (status === "error") {
    await notifyDeveloperIfRepeatedFailure(db, log.id, errorText ?? "");
  } else {
    try {
      alertSummary = await evaluateAndSendAlerts(db, now);
    } catch (error) {
      alertSummary = { error: errorMessage(error) };
      console.error("[fetch-prices] evaluasi alert gagal:", error);
    }
  }

  return {
    logId: log.id,
    source: source.name,
    status,
    done: pending.length === 0,
    rowsUpserted,
    latestDataDate: latest ?? null,
    processed,
    pending,
    failed,
    warnings: uniqueWarnings,
    alerts: alertSummary,
    durationMs: Date.now() - startedAt,
  };
}
