import { randomBytes } from "node:crypto";
import { and, asc, count, eq, gte, inArray, isNotNull, isNull, max } from "drizzle-orm";
import { addDays } from "../dates";
import { getDb, type Db } from "../db";
import { alerts, prices } from "../db/schema";
import { ensureReferenceData } from "../db/seed";
import { sendEmail } from "../email";
import { confirmationEmail, priceAlertEmail } from "../email/templates";
import { siteUrl } from "../env";
import type { PricePoint } from "../prices/calc";
import { hashIdentifier, hitRateLimit } from "../rate-limit";
import { findCommodityById, findRegionById, type Commodity, type Region } from "../reference";
import { evaluateCondition, isEligibleToSend, type AlertCondition, type ConditionType } from "./conditions";

export const SIGNUP_LIMIT_PER_HOUR = 5;
export const MAX_ACTIVE_ALERTS_PER_EMAIL = 10;

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,64}$/;
export const isValidToken = (token: string) => TOKEN_PATTERN.test(token);

export const confirmUrlFor = (token: string) => `${siteUrl()}/konfirmasi?token=${token}`;
export const unsubscribeUrlFor = (token: string) => `${siteUrl()}/berhenti?token=${token}`;
const oneClickUnsubscribeUrlFor = (token: string) => `${siteUrl()}/api/alerts/unsubscribe?token=${token}`;

export type CreateAlertInput = {
  email: string;
  commodityId: number;
  provinceId: number;
  condition: AlertCondition;
  /** Alamat IP peminta; hanya disimpan dalam bentuk hash untuk rate limit. */
  ip: string;
};

export type CreateAlertResult = { ok: true } | { ok: false; reason: "rate_limited" | "too_many_alerts" };

export async function createAlert(input: CreateAlertInput): Promise<CreateAlertResult> {
  const commodity = findCommodityById(input.commodityId);
  const region = findRegionById(input.provinceId);
  if (!commodity || !region) throw new Error("Komoditas atau wilayah tidak dikenal.");

  const db = await getDb();
  const limit = await hitRateLimit(db, `alert-signup:${hashIdentifier(input.ip)}`, SIGNUP_LIMIT_PER_HOUR, 3600);
  if (!limit.allowed) return { ok: false, reason: "rate_limited" };

  const [{ value: activeCount }] = await db
    .select({ value: count() })
    .from(alerts)
    .where(and(eq(alerts.email, input.email), isNull(alerts.unsubscribedAt)));
  if (activeCount >= MAX_ACTIVE_ALERTS_PER_EMAIL) return { ok: false, reason: "too_many_alerts" };

  // Alert merujuk tabel referensi (FK); pastikan sudah terisi meski cron belum pernah berjalan.
  await ensureReferenceData(db);
  const token = randomBytes(24).toString("base64url");
  const [created] = await db
    .insert(alerts)
    .values({
      email: input.email,
      commodityId: commodity.id,
      provinceId: region.id,
      conditionType: input.condition.type,
      threshold: input.condition.threshold,
      token,
    })
    .returning({ id: alerts.id });

  try {
    await sendEmail(
      confirmationEmail(input.email, {
        commodity,
        region,
        condition: input.condition,
        confirmUrl: confirmUrlFor(token),
        cancelUrl: unsubscribeUrlFor(token),
      }),
    );
  } catch (error) {
    // Tanpa email konfirmasi, alert tidak akan pernah aktif: hapus agar pengguna bisa mencoba lagi.
    await db.delete(alerts).where(eq(alerts.id, created.id));
    throw error;
  }
  return { ok: true };
}

export type AlertView = {
  commodity: Commodity;
  region: Region;
  condition: AlertCondition;
  confirmed: boolean;
  unsubscribed: boolean;
};

/** Detail alert untuk halaman konfirmasi/berhenti. Email sengaja tidak dikembalikan. */
export async function getAlertByToken(token: string): Promise<AlertView | null> {
  if (!isValidToken(token)) return null;
  const db = await getDb();
  const [row] = await db.select().from(alerts).where(eq(alerts.token, token)).limit(1);
  if (!row) return null;
  const commodity = findCommodityById(row.commodityId);
  const region = findRegionById(row.provinceId);
  if (!commodity || !region) return null;
  return {
    commodity,
    region,
    condition: { type: row.conditionType, threshold: row.threshold },
    confirmed: row.confirmedAt !== null,
    unsubscribed: row.unsubscribedAt !== null,
  };
}

export async function confirmAlertByToken(token: string): Promise<"confirmed" | "already" | "unsubscribed" | "not_found"> {
  if (!isValidToken(token)) return "not_found";
  const db = await getDb();
  const updated = await db
    .update(alerts)
    .set({ confirmedAt: new Date() })
    .where(and(eq(alerts.token, token), isNull(alerts.confirmedAt), isNull(alerts.unsubscribedAt)))
    .returning({ id: alerts.id });
  if (updated.length > 0) return "confirmed";
  const view = await getAlertByToken(token);
  if (!view) return "not_found";
  return view.unsubscribed ? "unsubscribed" : "already";
}

export async function unsubscribeByToken(token: string): Promise<"unsubscribed" | "already" | "not_found"> {
  if (!isValidToken(token)) return "not_found";
  const db = await getDb();
  const updated = await db
    .update(alerts)
    .set({ unsubscribedAt: new Date() })
    .where(and(eq(alerts.token, token), isNull(alerts.unsubscribedAt)))
    .returning({ id: alerts.id });
  if (updated.length > 0) return "unsubscribed";
  return (await getAlertByToken(token)) ? "already" : "not_found";
}

/** Membatalkan "berhenti berlangganan" (mis. terklik tidak sengaja). */
export async function reactivateByToken(token: string): Promise<"reactivated" | "not_found"> {
  if (!isValidToken(token)) return "not_found";
  const db = await getDb();
  const updated = await db
    .update(alerts)
    .set({ unsubscribedAt: null })
    .where(and(eq(alerts.token, token), isNotNull(alerts.unsubscribedAt)))
    .returning({ id: alerts.id });
  return updated.length > 0 ? "reactivated" : "not_found";
}

export type AlertRunSummary = { active: number; sent: number; failed: number };

/** Evaluasi semua alert aktif terhadap data terbaru dan kirim email yang memenuhi syarat. */
export async function evaluateAndSendAlerts(db: Db, now: Date): Promise<AlertRunSummary> {
  const active = await db
    .select()
    .from(alerts)
    .where(and(isNotNull(alerts.confirmedAt), isNull(alerts.unsubscribedAt)));
  if (active.length === 0) return { active: 0, sent: 0, failed: 0 };

  const [{ latest }] = await db.select({ latest: max(prices.date) }).from(prices);
  if (!latest) return { active: active.length, sent: 0, failed: 0 };

  const commodityIds = [...new Set(active.map((a) => a.commodityId))];
  const provinceIds = [...new Set(active.map((a) => a.provinceId))];
  const rows = await db
    .select({ commodityId: prices.commodityId, provinceId: prices.provinceId, date: prices.date, price: prices.price })
    .from(prices)
    .where(
      and(
        gte(prices.date, addDays(latest, -30)),
        inArray(prices.commodityId, commodityIds),
        inArray(prices.provinceId, provinceIds),
      ),
    )
    .orderBy(asc(prices.date));

  const seriesByPair = new Map<string, PricePoint[]>();
  for (const r of rows) {
    const key = `${r.commodityId}:${r.provinceId}`;
    const list = seriesByPair.get(key) ?? [];
    list.push({ date: r.date, price: r.price });
    seriesByPair.set(key, list);
  }

  let sent = 0;
  let failed = 0;
  for (const alert of active) {
    const commodity = findCommodityById(alert.commodityId);
    const region = findRegionById(alert.provinceId);
    if (!commodity || !region) continue;

    const condition = { type: alert.conditionType as ConditionType, threshold: alert.threshold };
    const result = evaluateCondition(condition, seriesByPair.get(`${alert.commodityId}:${alert.provinceId}`) ?? []);
    if (!result?.met || !isEligibleToSend(alert, result.latest.date, now)) continue;

    try {
      await sendEmail(
        priceAlertEmail(alert.email, {
          commodity,
          region,
          condition,
          result,
          detailUrl: `${siteUrl()}/komoditas/${commodity.slug}?wilayah=${region.slug}`,
          unsubscribeUrl: unsubscribeUrlFor(alert.token),
          oneClickUnsubscribeUrl: oneClickUnsubscribeUrlFor(alert.token),
        }),
      );
      await db
        .update(alerts)
        .set({ lastSentAt: now, lastSentDataDate: result.latest.date })
        .where(eq(alerts.id, alert.id));
      sent++;
    } catch (error) {
      failed++;
      console.error(`[alerts] gagal mengirim alert #${alert.id}:`, error);
    }
  }
  return { active: active.length, sent, failed };
}
