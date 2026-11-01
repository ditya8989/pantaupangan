import { findRegionBySlug } from "./reference";

/** Kunci localStorage untuk wilayah pilihan terakhir (PRD F1). */
export const REGION_STORAGE_KEY = "pantaupangan:wilayah";

/** Slug wilayah tersimpan, atau null jika tidak ada / tidak valid / storage diblokir. */
export function readStoredRegionSlug(): string | null {
  try {
    const value = window.localStorage.getItem(REGION_STORAGE_KEY);
    return value && findRegionBySlug(value) ? value : null;
  } catch {
    return null;
  }
}

export function storeRegionSlug(slug: string): void {
  try {
    window.localStorage.setItem(REGION_STORAGE_KEY, slug);
  } catch {
    // Storage diblokir (mode privat, dsb.): pilihan tidak diingat, aplikasi tetap jalan.
  }
}

export function regionPath(slug: string): string {
  return slug === "nasional" ? "/" : `/wilayah/${slug}`;
}
