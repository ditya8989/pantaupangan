import { afterEach, describe, expect, it, vi } from "vitest";
import { sourceLabel } from "@/lib/attribution";
import { alertsEnabled } from "@/lib/env";
import { formatDateId, isWeekend, parseSlashDate, todayInJakarta } from "@/lib/dates";
import { formatPercentDelta, formatRupiah, formatRupiahDelta } from "@/lib/format";
import { computeWindowStart, stalestFirst } from "@/lib/jobs/window";
import { COMMODITIES, PROVINCES } from "@/lib/reference";
import { mockSource } from "@/lib/sources/mock";

describe("format", () => {
  it("rupiah dan persen gaya Indonesia", () => {
    expect(formatRupiah(15510)).toBe("Rp15.510");
    expect(formatRupiah(950)).toBe("Rp950");
    expect(formatRupiahDelta(1850)).toBe("+Rp1.850");
    expect(formatRupiahDelta(-1850)).toBe("−Rp1.850");
    expect(formatPercentDelta(1.94)).toBe("+1,9%");
    expect(formatPercentDelta(-0.04)).toBe("0,0%");
  });

  it("tanggal", () => {
    expect(formatDateId("2026-11-01")).toBe("1 Nov 2026");
    expect(formatDateId("2026-08-17")).toBe("17 Agu 2026");
    expect(parseSlashDate("30/10/2026")).toBe("2026-10-30");
    expect(parseSlashDate("31/02/2026")).toBeNull();
    expect(parseSlashDate("2026-10-30")).toBeNull();
    expect(isWeekend("2026-10-31")).toBe(true);
    expect(isWeekend("2026-11-02")).toBe(false);
    // 1 Nov 2026 20:00 UTC = 2 Nov 03:00 WIB
    expect(todayInJakarta(new Date("2026-11-01T20:00:00Z"))).toBe("2026-11-02");
  });
});

describe("computeWindowStart", () => {
  it("backfill 90 hari jika belum ada data", () => {
    expect(computeWindowStart("2026-11-02", null)).toBe("2026-08-04");
  });
  it("selalu mengambil ulang 7 hari terakhir", () => {
    expect(computeWindowStart("2026-11-02", "2026-10-30")).toBe("2026-10-26");
  });
  it("menutup celah jika cron sempat berhenti, maksimal 90 hari", () => {
    expect(computeWindowStart("2026-11-02", "2026-10-10")).toBe("2026-10-10");
    expect(computeWindowStart("2026-11-02", "2026-01-01")).toBe("2026-08-04");
  });
});

describe("alertsEnabled", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("selalu aktif di lokal (email masuk kotak keluar dev)", () => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("RESEND_API_KEY", "");
    expect(alertsEnabled()).toBe(true);
  });
  it("di Vercel hanya aktif jika RESEND_API_KEY diisi", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("RESEND_API_KEY", "");
    expect(alertsEnabled()).toBe(false);
    vi.stubEnv("RESEND_API_KEY", "re_contoh");
    expect(alertsEnabled()).toBe(true);
  });
});

describe("sourceLabel", () => {
  it("menuliskan nama sumber lengkap untuk kolom CSV", () => {
    expect(sourceLabel("pihps")).toBe("PIHPS Nasional, Bank Indonesia");
    expect(sourceLabel("mock")).toContain("bukan harga sebenarnya");
  });
});

describe("stalestFirst", () => {
  it("memproses komoditas tanpa data / data terlama lebih dulu, sisanya tetap urutan asal", () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
    const latest = new Map<number, string | null>([
      [1, "2026-10-30"],
      [2, "2026-10-30"],
      [3, "2026-10-29"], // tertinggal dari run kemarin
      [4, null], // belum pernah diambil
      [5, "2026-10-30"],
    ]);
    expect(stalestFirst(items, latest).map((c) => c.id)).toEqual([4, 3, 1, 2, 5]);
    expect(items.map((c) => c.id)).toEqual([1, 2, 3, 4, 5]); // input tidak diubah
  });
});

describe("reference", () => {
  it("10 komoditas dan 34 provinsi dengan slug unik", () => {
    expect(COMMODITIES).toHaveLength(10);
    expect(PROVINCES).toHaveLength(34);
    expect(new Set(PROVINCES.map((p) => p.slug)).size).toBe(34);
    expect(PROVINCES.find((p) => p.name === "DI Yogyakarta")?.slug).toBe("di-yogyakarta");
  });
});

describe("mockSource", () => {
  const params = { startDate: "2026-10-26", endDate: "2026-11-01", commodityCodes: ["com_16", "com_3"] };

  it("deterministik, hanya hari kerja, dan dibulatkan ke Rp50", async () => {
    const a = await mockSource.fetchPrices(params);
    const b = await mockSource.fetchPrices(params);
    expect(a).toEqual(b);
    expect(a.warnings).toEqual([]);
    const dates = new Set(a.records.map((r) => r.date));
    expect([...dates].sort()).toEqual(["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"]);
    expect(a.records.every((r) => r.price > 0 && r.price % 50 === 0)).toBe(true);
  });

  it("meniru pasangan komoditas–provinsi yang kosong dan menyertakan nasional", async () => {
    const { records } = await mockSource.fetchPrices(params);
    const rawitOneDay = records.filter((r) => r.commodityCode === "com_16" && r.date === "2026-10-30");
    expect(rawitOneDay.some((r) => r.provinceName === "Aceh")).toBe(false);
    expect(rawitOneDay.filter((r) => r.provinceName === null)).toHaveLength(1);
    expect(rawitOneDay).toHaveLength(32 + 1);
  });
});
