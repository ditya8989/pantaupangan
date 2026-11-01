import { todayInJakarta } from "../dates";
import { formatRupiah } from "../format";
import { computeChanges, type PricePoint } from "../prices/calc";

export type ConditionType = "above" | "pct7d";

export type AlertCondition = { type: ConditionType; threshold: number };

export type ConditionResult = {
  met: boolean;
  latest: PricePoint;
  /** Titik pembanding 7 hari (jika ada). */
  reference: PricePoint | null;
  /** Persen perubahan vs 7 hari lalu (jika ada). */
  changePct: number | null;
};

/**
 * - "above": harga terbaru > Rp X
 * - "pct7d": kenaikan vs 7 hari lalu > Y% (definisi 7 hari sama dengan dashboard)
 * `series` harus urut naik menurut tanggal.
 */
export function evaluateCondition(condition: AlertCondition, series: readonly PricePoint[]): ConditionResult | null {
  const changes = computeChanges(series);
  if (!changes) return null;

  const week = changes.vsWeek;
  const met =
    condition.type === "above"
      ? changes.latest.price > condition.threshold
      : week !== null && week.pct > condition.threshold;

  return {
    met,
    latest: changes.latest,
    reference: week?.from ?? null,
    changePct: week?.pct ?? null,
  };
}

export type AlertSendState = {
  confirmedAt: Date | null;
  unsubscribedAt: Date | null;
  lastSentAt: Date | null;
  lastSentDataDate: string | null;
};

/**
 * Boleh mengirim email untuk alert ini?
 * Syarat: sudah dikonfirmasi, belum berhenti berlangganan, belum mengirim hari ini (WIB),
 * dan ada tanggal data yang lebih baru dari email terakhir (data Jumat tidak memicu email ulang di akhir pekan).
 */
export function isEligibleToSend(alert: AlertSendState, latestDataDate: string, now: Date): boolean {
  if (!alert.confirmedAt || alert.unsubscribedAt) return false;
  if (alert.lastSentDataDate && alert.lastSentDataDate >= latestDataDate) return false;
  if (alert.lastSentAt && todayInJakarta(alert.lastSentAt) === todayInJakarta(now)) return false;
  return true;
}

function formatThresholdPercent(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");
}

export function describeCondition(condition: AlertCondition): string {
  return condition.type === "above"
    ? `harga di atas ${formatRupiah(condition.threshold)}`
    : `naik lebih dari ${formatThresholdPercent(condition.threshold)}% dalam 7 hari`;
}
