import { addDays, maxDate, minDate } from "../dates";

/** Riwayat maksimum yang diambil saat database masih kosong (backfill). */
export const HISTORY_DAYS = 90;
/** Setiap run selalu mengambil ulang N hari terakhir untuk menangkap data terlambat/revisi. */
export const REFRESH_WINDOW_DAYS = 7;

/**
 * Tanggal awal pengambilan untuk satu komoditas:
 * - belum ada data → hari ini − 90 hari (backfill)
 * - ada data → hari ini − 7 hari, atau mundur sampai data terakhir jika ada celah lebih panjang
 *   (mis. cron sempat mati), dibatasi maksimal 90 hari.
 */
export function computeWindowStart(today: string, latestForCommodity: string | null): string {
  const floor = addDays(today, -HISTORY_DAYS);
  if (!latestForCommodity) return floor;
  return maxDate(floor, minDate(addDays(today, -REFRESH_WINDOW_DAYS), latestForCommodity));
}

/**
 * Urutan proses: komoditas tanpa data atau dengan data paling lama lebih dulu (urutan asal dipertahankan
 * jika tanggalnya sama). Kalau satu run terpotong batas waktu, komoditas yang tertinggal tidak
 * terus-menerus kebagian urutan terakhir; cron di plan Hobby hanya berjalan sekali sehari.
 */
export function stalestFirst<T extends { id: number }>(items: readonly T[], latestById: ReadonlyMap<number, string | null>): T[] {
  return [...items].sort((a, b) => (latestById.get(a.id) ?? "").localeCompare(latestById.get(b.id) ?? ""));
}
