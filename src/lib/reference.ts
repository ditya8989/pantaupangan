/**
 * Data referensi tetap: komoditas dan wilayah.
 * ID sengaja dibuat tetap (bukan serial) supaya halaman bisa memakai konstanta ini
 * tanpa query ke database, dan tabel `prices` merujuk ID yang sama.
 */

export type Commodity = {
  id: number;
  slug: string;
  /** Nama tampilan, mengikuti nama di PIHPS (lihat PRD §4). */
  name: string;
  unit: string;
  category: string;
  sortOrder: number;
  /** Kode komoditas di PIHPS Bank Indonesia (`comcat_id`). */
  sourceCode: string;
};

export type Region = {
  /** 0 = Nasional; 1–34 = ID provinsi di PIHPS. */
  id: number;
  /** "ID" untuk nasional, selain itu kode provinsi BPS. */
  code: string;
  slug: string;
  /** Nama persis seperti di PIHPS (dipakai untuk pemetaan respons). */
  name: string;
};

export const COMMODITIES: readonly Commodity[] = [
  { id: 1, slug: "beras-super-1", name: "Beras Kualitas Super I", unit: "kg", category: "Beras", sortOrder: 1, sourceCode: "com_5" },
  { id: 2, slug: "beras-medium-1", name: "Beras Kualitas Medium I", unit: "kg", category: "Beras", sortOrder: 2, sourceCode: "com_3" },
  { id: 3, slug: "cabai-merah-keriting", name: "Cabai Merah Keriting", unit: "kg", category: "Cabai Merah", sortOrder: 3, sourceCode: "com_14" },
  { id: 4, slug: "cabai-rawit-merah", name: "Cabai Rawit Merah", unit: "kg", category: "Cabai Rawit", sortOrder: 4, sourceCode: "com_16" },
  { id: 5, slug: "bawang-merah", name: "Bawang Merah Ukuran Sedang", unit: "kg", category: "Bawang Merah", sortOrder: 5, sourceCode: "com_11" },
  { id: 6, slug: "bawang-putih", name: "Bawang Putih Ukuran Sedang", unit: "kg", category: "Bawang Putih", sortOrder: 6, sourceCode: "com_12" },
  { id: 7, slug: "minyak-goreng-kemasan", name: "Minyak Goreng Kemasan Bermerk 1", unit: "kg", category: "Minyak Goreng", sortOrder: 7, sourceCode: "com_18" },
  { id: 8, slug: "gula-pasir-lokal", name: "Gula Pasir Lokal", unit: "kg", category: "Gula Pasir", sortOrder: 8, sourceCode: "com_21" },
  { id: 9, slug: "telur-ayam-ras", name: "Telur Ayam Ras Segar", unit: "kg", category: "Telur Ayam", sortOrder: 9, sourceCode: "com_10" },
  { id: 10, slug: "daging-ayam-ras", name: "Daging Ayam Ras Segar", unit: "kg", category: "Daging Ayam", sortOrder: 10, sourceCode: "com_7" },
];

export const NATIONAL_ID = 0;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const PROVINCE_ROWS: ReadonlyArray<[id: number, code: string, name: string]> = [
  [1, "11", "Aceh"],
  [2, "12", "Sumatera Utara"],
  [3, "13", "Sumatera Barat"],
  [4, "14", "Riau"],
  [5, "21", "Kepulauan Riau"],
  [6, "15", "Jambi"],
  [7, "17", "Bengkulu"],
  [8, "16", "Sumatera Selatan"],
  [9, "19", "Kepulauan Bangka Belitung"],
  [10, "18", "Lampung"],
  [11, "36", "Banten"],
  [12, "32", "Jawa Barat"],
  [13, "31", "DKI Jakarta"],
  [14, "33", "Jawa Tengah"],
  [15, "34", "DI Yogyakarta"],
  [16, "35", "Jawa Timur"],
  [17, "51", "Bali"],
  [18, "52", "Nusa Tenggara Barat"],
  [19, "53", "Nusa Tenggara Timur"],
  [20, "61", "Kalimantan Barat"],
  [21, "63", "Kalimantan Selatan"],
  [22, "62", "Kalimantan Tengah"],
  [23, "64", "Kalimantan Timur"],
  [24, "65", "Kalimantan Utara"],
  [25, "75", "Gorontalo"],
  [26, "73", "Sulawesi Selatan"],
  [27, "74", "Sulawesi Tenggara"],
  [28, "72", "Sulawesi Tengah"],
  [29, "71", "Sulawesi Utara"],
  [30, "76", "Sulawesi Barat"],
  [31, "81", "Maluku"],
  [32, "82", "Maluku Utara"],
  [33, "94", "Papua"],
  [34, "91", "Papua Barat"],
];

export const NATIONAL: Region = { id: NATIONAL_ID, code: "ID", slug: "nasional", name: "Nasional" };

/** 34 provinsi, diurutkan menurut nama. */
export const PROVINCES: readonly Region[] = PROVINCE_ROWS.map(([id, code, name]) => ({
  id,
  code,
  slug: slugify(name),
  name,
})).sort((a, b) => a.name.localeCompare(b.name, "id"));

/** Nasional di urutan pertama, lalu provinsi menurut nama. */
export const REGIONS: readonly Region[] = [NATIONAL, ...PROVINCES];

const regionById = new Map(REGIONS.map((r) => [r.id, r]));
const regionBySlug = new Map(REGIONS.map((r) => [r.slug, r]));
const commodityById = new Map(COMMODITIES.map((c) => [c.id, c]));
const commodityBySlug = new Map(COMMODITIES.map((c) => [c.slug, c]));
const commodityBySourceCode = new Map(COMMODITIES.map((c) => [c.sourceCode, c]));

export const findRegionById = (id: number) => regionById.get(id);
export const findRegionBySlug = (slug: string) => regionBySlug.get(slug);
export const findCommodityById = (id: number) => commodityById.get(id);
export const findCommodityBySlug = (slug: string) => commodityBySlug.get(slug);
export const findCommodityBySourceCode = (code: string) => commodityBySourceCode.get(code);

/** Normalisasi nama wilayah dari sumber: huruf kecil, tanpa titik, spasi dirapikan. */
export function normalizeRegionName(name: string): string {
  return name.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
}

const provinceIdByNormalizedName = new Map(PROVINCES.map((p) => [normalizeRegionName(p.name), p.id]));

/** Cari ID provinsi dari nama di respons PIHPS. `undefined` jika tidak dikenal. */
export function provinceIdFromSourceName(name: string): number | undefined {
  return provinceIdByNormalizedName.get(normalizeRegionName(name));
}
