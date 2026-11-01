/** Akses environment variable di satu tempat, dengan default yang aman untuk lokal. */

export type DataSourceName = "pihps" | "mock";

/** URL publik situs, tanpa garis miring di akhir. */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProduction) return `https://${vercelProduction}`;
  return "http://localhost:3000";
}

export function dataSourceName(): DataSourceName {
  const value = (process.env.DATA_SOURCE || "pihps").trim().toLowerCase();
  if (value === "pihps" || value === "mock") return value;
  throw new Error(`DATA_SOURCE "${process.env.DATA_SOURCE}" tidak dikenal. Gunakan "pihps" atau "mock".`);
}

export function emailFrom(): string {
  return process.env.EMAIL_FROM || "PantauPangan <onboarding@resend.dev>";
}

export function isOnVercel(): boolean {
  return Boolean(process.env.VERCEL);
}

/** Tanpa RESEND_API_KEY di luar Vercel, email ditampung di kotak keluar dev (/dev/email). */
export function usesDevOutbox(): boolean {
  return !process.env.RESEND_API_KEY && !isOnVercel();
}

/**
 * Fitur peringatan email aktif jika email benar-benar bisa terkirim: lewat Resend, atau ke kotak keluar
 * dev saat berjalan di lokal. Di Vercel tanpa RESEND_API_KEY, halaman /peringatan menampilkan "segera hadir".
 * Halaman itu di-prerender, jadi setelah menambah RESEND_API_KEY di Vercel, lakukan redeploy.
 */
export function alertsEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY) || !isOnVercel();
}
