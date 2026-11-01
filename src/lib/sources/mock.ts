import { dateRange, daysBetween, isWeekend } from "../dates";
import { PROVINCES } from "../reference";
import type { PriceRecord, PriceSource } from "./types";

/**
 * Sumber data contoh (DATA_SOURCE=mock): deterministik, tanpa jaringan.
 * Meniru pola PIHPS: hanya hari kerja, beberapa pasangan komoditas–provinsi kosong,
 * dan nilai dibulatkan ke Rp50.
 */

type Profile = { base: number; volatility: number };

/** Harga dasar mendekati rata-rata nasional PIHPS akhir Oktober 2026. */
const PROFILES: Record<string, Profile> = {
  com_5: { base: 17_700, volatility: 0.03 },
  com_3: { base: 16_650, volatility: 0.025 },
  com_14: { base: 83_500, volatility: 0.3 },
  com_16: { base: 96_200, volatility: 0.32 },
  com_11: { base: 46_000, volatility: 0.15 },
  com_12: { base: 41_000, volatility: 0.1 },
  com_18: { base: 21_500, volatility: 0.03 },
  com_21: { base: 18_700, volatility: 0.03 },
  com_10: { base: 29_350, volatility: 0.08 },
  com_7: { base: 38_500, volatility: 0.07 },
};

/** Pasangan yang sengaja tidak dilaporkan, seperti di data asli. */
const MISSING_PAIRS = new Set(["com_16|Aceh", "com_16|Sumatera Barat", "com_12|Papua Barat"]);

const COSTLIER_REGIONS = new Set([
  "Papua",
  "Papua Barat",
  "Maluku",
  "Maluku Utara",
  "Nusa Tenggara Timur",
  "Kalimantan Utara",
]);

const EPOCH = "2020-01-06";

/** FNV-1a 32-bit → [0, 1) */
function hash01(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 4_294_967_296;
}

/** Value noise halus di [-1, 1]: titik acak tiap `period` hari, diinterpolasi smoothstep. */
function smoothNoise(seed: string, t: number, period: number): number {
  const x = t / period;
  const i = Math.floor(x);
  const f = x - i;
  const a = hash01(`${seed}:${i}`) * 2 - 1;
  const b = hash01(`${seed}:${i + 1}`) * 2 - 1;
  const s = f * f * (3 - 2 * f);
  return a + (b - a) * s;
}

const roundTo50 = (n: number) => Math.max(50, Math.round(n / 50) * 50);

function provincePrice(code: string, profile: Profile, provinceName: string, date: string): number {
  const t = daysBetween(date, EPOCH);
  const regionFactor =
    0.92 + hash01(`${code}|${provinceName}|factor`) * 0.16 + (COSTLIER_REGIONS.has(provinceName) ? 0.15 : 0);
  const movement = smoothNoise(`${code}|trend`, t, 21) * 0.7 + smoothNoise(`${code}|${provinceName}|local`, t, 9) * 0.3;
  const jitter = (hash01(`${code}|${provinceName}|${date}`) - 0.5) * 0.01;
  return roundTo50(profile.base * regionFactor * (1 + profile.volatility * movement + jitter));
}

export const mockSource: PriceSource = {
  name: "mock",
  async fetchPrices({ startDate, endDate, commodityCodes }) {
    const records: PriceRecord[] = [];
    const warnings: string[] = [];
    const dates = dateRange(startDate, endDate).filter((d) => !isWeekend(d));

    for (const code of commodityCodes) {
      const profile = PROFILES[code];
      if (!profile) {
        warnings.push(`Mock: komoditas ${code} tidak punya profil harga, dilewati.`);
        continue;
      }
      for (const date of dates) {
        let sum = 0;
        let count = 0;
        for (const province of PROVINCES) {
          if (MISSING_PAIRS.has(`${code}|${province.name}`)) continue;
          const price = provincePrice(code, profile, province.name, date);
          records.push({ commodityCode: code, provinceName: province.name, date, price });
          sum += price;
          count++;
        }
        records.push({ commodityCode: code, provinceName: null, date, price: roundTo50(sum / count) });
      }
    }
    return { records, warnings };
  },
};
