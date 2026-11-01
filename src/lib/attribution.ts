/** Sumber data harga dan pemilik situs: dipakai di footer, halaman data, email, dan CSV. */
export const SOURCE_NAME = "PIHPS Nasional, Bank Indonesia";
export const SOURCE_FULL_NAME = "Pusat Informasi Harga Pangan Strategis (PIHPS) Nasional, Bank Indonesia";
export const SOURCE_URL = "https://www.bi.go.id/hargapangan";

export const SITE_OWNER = "Muhammad Aditya";
/** Tahun situs pertama kali terbit. Ditulis tetap karena halaman di-prerender. */
export const COPYRIGHT_YEAR = 2026;

/** Label untuk kolom `sumber` (nilai di database: "pihps" | "mock"). */
export function sourceLabel(source: string): string {
  if (source === "pihps") return SOURCE_NAME;
  if (source === "mock") return "Data contoh (bukan harga sebenarnya)";
  return source;
}
