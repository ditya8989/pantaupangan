import { z } from "zod";
import { SOURCE_URL } from "../attribution";
import { parseSlashDate } from "../dates";
import { siteUrl } from "../env";
import { SourceFormatError, type FetchPricesResult, type PriceRecord, type PriceSource } from "./types";

/**
 * Adapter PIHPS Nasional (Bank Indonesia).
 * Memakai endpoint JSON yang dipakai frontend https://www.bi.go.id/hargapangan (lihat PRD §4).
 * Endpoint ini tidak terdokumentasi resmi: setiap perubahan format harus menggagalkan run.
 */

const GRID_ENDPOINT = `${SOURCE_URL}/WebSite/TabelHarga/GetGridDataKomoditas`;

/** Jeda minimal antar-request agar tidak membebani sumber. */
const REQUEST_GAP_MS = 1_000;
const REQUEST_TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 3_000;

const NON_DATE_KEYS = new Set(["no", "name", "level"]);

const rowSchema = z.looseObject({ name: z.string(), level: z.number() });
const responseSchema = z.object({ data: z.array(rowSchema) });

/** "16,650" → 16650; "-" / "" / null / 0 → null (tidak ada laporan). Format lain → SourceFormatError. */
export function parsePihpsPrice(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
  }
  if (typeof value !== "string") {
    throw new SourceFormatError(`Nilai harga PIHPS tidak dikenal: ${JSON.stringify(value)}`);
  }
  const s = value.trim();
  if (s === "" || s === "-") return null;
  if (!/^\d{1,3}(,\d{3})*(\.\d+)?$/.test(s) && !/^\d+(\.\d+)?$/.test(s)) {
    throw new SourceFormatError(`Format harga PIHPS tidak dikenal: "${value}"`);
  }
  const n = Number(s.replace(/,/g, ""));
  return n > 0 ? Math.round(n) : null;
}

/**
 * Ubah respons `GetGridDataKomoditas` menjadi PriceRecord.
 * Baris level 0 = nasional ("Semua Provinsi"), level 1 = provinsi; tiap key "DD/MM/YYYY" adalah satu tanggal.
 */
export function parsePihpsResponse(json: unknown, commodityCode: string): FetchPricesResult {
  const parsed = responseSchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new SourceFormatError(
      `Struktur respons PIHPS (${commodityCode}) tidak sesuai: ${issue ? `${issue.path.join(".")} ${issue.message}` : "tidak valid"}`,
    );
  }

  const records: PriceRecord[] = [];
  const warnings: string[] = [];
  let sawNational = false;
  let otherKeys = 0;
  let dateKeys = 0;

  for (const row of parsed.data.data) {
    let provinceName: string | null;
    if (row.level === 0) {
      provinceName = null;
      sawNational = true;
    } else if (row.level === 1) {
      provinceName = row.name.trim();
    } else {
      continue; // level kota/pasar tidak diminta (showKota=false)
    }

    for (const [key, value] of Object.entries(row)) {
      if (NON_DATE_KEYS.has(key)) continue;
      const date = parseSlashDate(key);
      if (!date) {
        otherKeys++;
        continue;
      }
      dateKeys++;
      const price = parsePihpsPrice(value);
      if (price !== null) records.push({ commodityCode, provinceName, date, price });
    }
  }

  if (dateKeys === 0 && otherKeys > 0) {
    throw new SourceFormatError(`Respons PIHPS (${commodityCode}) tidak berisi kolom tanggal "DD/MM/YYYY"; format kemungkinan berubah.`);
  }
  if (parsed.data.data.length > 0 && !sawNational) {
    warnings.push(`PIHPS ${commodityCode}: baris nasional (level 0) tidak ada di respons.`);
  }
  return { records, warnings };
}

function userAgent(): string {
  return `PantauPangan/1.0 (+${siteUrl()})`;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
let lastRequestFinishedAt = 0;

async function requestGrid(commodityCode: string, startDate: string, endDate: string): Promise<unknown> {
  const params = new URLSearchParams({
    price_type_id: "1", // harga konsumen, pasar tradisional
    comcat_id: commodityCode,
    province_id: "", // kosong = semua provinsi sekaligus
    regency_id: "",
    showKota: "false",
    showPasar: "false",
    tipe_laporan: "1", // harian
    start_date: startDate,
    end_date: endDate,
  });
  const url = `${GRID_ENDPOINT}?${params}`;

  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const wait = lastRequestFinishedAt + REQUEST_GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": userAgent(), Accept: "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("json")) {
        throw new SourceFormatError(`PIHPS mengembalikan "${contentType || "tanpa content-type"}", bukan JSON.`);
      }
      return await res.json();
    } catch (error) {
      if (error instanceof SourceFormatError) throw error;
      lastError = error;
      if (attempt < 2) await sleep(RETRY_DELAY_MS);
    } finally {
      lastRequestFinishedAt = Date.now();
    }
  }
  const reason = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Gagal mengambil data PIHPS ${commodityCode}: ${reason}`);
}

export const pihpsSource: PriceSource = {
  name: "pihps",
  async fetchPrices({ startDate, endDate, commodityCodes }) {
    const records: PriceRecord[] = [];
    const warnings: string[] = [];
    // Berurutan (bukan paralel): satu request per komoditas, semua provinsi sekaligus.
    for (const code of commodityCodes) {
      const json = await requestGrid(code, startDate, endDate);
      const result = parsePihpsResponse(json, code);
      records.push(...result.records);
      warnings.push(...result.warnings);
    }
    return { records, warnings };
  },
};
