import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { provinceIdFromSourceName } from "@/lib/reference";
import { parsePihpsPrice, parsePihpsResponse } from "@/lib/sources/pihps";
import { SourceFormatError } from "@/lib/sources/types";

function fixture(name: string): unknown {
  return JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));
}

describe("parsePihpsPrice", () => {
  it("mengubah string berpemisah koma menjadi integer rupiah", () => {
    expect(parsePihpsPrice("16,650")).toBe(16650);
    expect(parsePihpsPrice("1,234,500")).toBe(1234500);
    expect(parsePihpsPrice("950")).toBe(950);
    expect(parsePihpsPrice(" 99,400 ")).toBe(99400);
    expect(parsePihpsPrice("16,650.60")).toBe(16651);
    expect(parsePihpsPrice(29350)).toBe(29350);
  });

  it("menganggap '-', kosong, null, dan 0 sebagai tidak ada laporan", () => {
    expect(parsePihpsPrice("-")).toBeNull();
    expect(parsePihpsPrice("")).toBeNull();
    expect(parsePihpsPrice(null)).toBeNull();
    expect(parsePihpsPrice(undefined)).toBeNull();
    expect(parsePihpsPrice("0")).toBeNull();
    expect(parsePihpsPrice(0)).toBeNull();
  });

  it("gagal keras pada format yang tidak dikenal", () => {
    expect(() => parsePihpsPrice("Rp16.650")).toThrow(SourceFormatError);
    expect(() => parsePihpsPrice("16.650,00")).toThrow(SourceFormatError);
    expect(() => parsePihpsPrice({ value: 1 })).toThrow(SourceFormatError);
  });
});

describe("parsePihpsResponse (respons asli PIHPS)", () => {
  const json = fixture("pihps-com16-semua-provinsi-2026-10-28_30.json");
  const { records, warnings } = parsePihpsResponse(json, "com_16");

  it("membaca baris nasional (level 0) untuk setiap tanggal", () => {
    const national = records.filter((r) => r.provinceName === null);
    expect(national).toEqual([
      { commodityCode: "com_16", provinceName: null, date: "2026-10-28", price: 99400 },
      { commodityCode: "com_16", provinceName: null, date: "2026-10-29", price: 98050 },
      { commodityCode: "com_16", provinceName: null, date: "2026-10-30", price: 96200 },
    ]);
    expect(warnings).toEqual([]);
  });

  it("melewati nilai '-' tanpa menyimpannya sebagai 0", () => {
    const kepri = records.filter((r) => r.provinceName === "Kepulauan Riau");
    expect(kepri).toEqual([{ commodityCode: "com_16", provinceName: "Kepulauan Riau", date: "2026-10-30", price: 83350 }]);
    expect(records.every((r) => r.price > 0)).toBe(true);
  });

  it("semua nama provinsi di respons dapat dipetakan ke tabel provinsi", () => {
    const names = new Set(records.filter((r) => r.provinceName !== null).map((r) => r.provinceName as string));
    expect(names.size).toBe(32);
    const unknown = [...names].filter((n) => provinceIdFromSourceName(n) === undefined);
    expect(unknown).toEqual([]);
  });

  it("membaca rentang tanggal panjang dari satu provinsi", () => {
    const dki = parsePihpsResponse(fixture("pihps-com3-dki-2026-10-20_30.json"), "com_3").records;
    const jakarta = dki.filter((r) => r.provinceName === "DKI Jakarta");
    expect(jakarta).toHaveLength(9); // 20–30 Okt, tanpa akhir pekan 24–25 Okt
    expect(jakarta.map((r) => r.date)).not.toContain("2026-10-24");
    expect(jakarta.every((r) => r.price === 17050)).toBe(true);
  });
});

describe("parsePihpsResponse (format berubah)", () => {
  it("gagal jika struktur respons tidak sesuai", () => {
    expect(() => parsePihpsResponse({ rows: [] }, "com_1")).toThrow(SourceFormatError);
    expect(() => parsePihpsResponse({ data: [{ nama: "Aceh", level: 1 }] }, "com_1")).toThrow(SourceFormatError);
  });

  it("gagal jika kolom tanggal tidak lagi berformat DD/MM/YYYY", () => {
    const json = { data: [{ no: "I", name: "Semua Provinsi", level: 0, "2026-10-30": "16,650" }] };
    expect(() => parsePihpsResponse(json, "com_3")).toThrow(SourceFormatError);
  });

  it("memberi peringatan jika baris nasional hilang", () => {
    const json = { data: [{ no: "II", name: "Aceh", level: 1, "30/10/2026": "16,650" }] };
    const result = parsePihpsResponse(json, "com_3");
    expect(result.records).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);
  });

  it("respons kosong (mis. rentang hanya akhir pekan) bukan error", () => {
    expect(parsePihpsResponse({ data: [] }, "com_3")).toEqual({ records: [], warnings: [] });
  });
});
