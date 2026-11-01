import { describe, expect, it } from "vitest";
import { computeChanges, direction, normalizeSeries, summarize, type PricePoint } from "@/lib/prices/calc";

const p = (date: string, price: number): PricePoint => ({ date, price });

// Hari kerja saja, seperti data PIHPS (24–25 Okt dan 31 Okt–1 Nov adalah akhir pekan).
const series: PricePoint[] = [
  p("2026-10-19", 95000),
  p("2026-10-20", 95500),
  p("2026-10-21", 96000),
  p("2026-10-22", 96000),
  p("2026-10-23", 97000),
  p("2026-10-26", 98000),
  p("2026-10-27", 99000),
  p("2026-10-28", 99400),
  p("2026-10-29", 98050),
  p("2026-10-30", 96200),
  p("2026-11-02", 97200),
];

describe("computeChanges", () => {
  it("membandingkan dengan hari data sebelumnya, melewati akhir pekan", () => {
    const changes = computeChanges(series)!;
    expect(changes.latest).toEqual(p("2026-11-02", 97200));
    expect(changes.vsPrevious?.from).toEqual(p("2026-10-30", 96200)); // Senin vs Jumat
    expect(changes.vsPrevious?.abs).toBe(1000);
    expect(changes.vsPrevious?.pct).toBeCloseTo(1.0395, 3);
    expect(changes.vsPrevious?.direction).toBe("naik");
  });

  it("vs 7 hari lalu memakai tanggal data terakhir ≤ (terbaru − 7 hari)", () => {
    const changes = computeChanges(series)!;
    expect(changes.vsWeek?.from).toEqual(p("2026-10-26", 98000));
    expect(changes.vsWeek?.abs).toBe(-800);
    expect(changes.vsWeek?.direction).toBe("turun");
  });

  it("jika tanggal tepat 7 hari lalu libur, mundur ke hari data sebelumnya", () => {
    const withHoliday = series.filter((x) => x.date !== "2026-10-26");
    expect(computeChanges(withHoliday)!.vsWeek?.from).toEqual(p("2026-10-23", 97000));
  });

  it("tidak memberi pembanding 7 hari jika data terlalu jarang (> 14 hari)", () => {
    const sparse = [p("2026-10-01", 90000), p("2026-10-30", 96200)];
    const changes = computeChanges(sparse)!;
    expect(changes.vsWeek).toBeNull();
    expect(changes.vsPrevious?.from.date).toBe("2026-10-01");
  });

  it("deret satu titik atau kosong", () => {
    expect(computeChanges([])).toBeNull();
    const single = computeChanges([p("2026-10-30", 96200)])!;
    expect(single.vsPrevious).toBeNull();
    expect(single.vsWeek).toBeNull();
  });
});

describe("direction", () => {
  it("memakai ambang stabil 0,5%", () => {
    expect(direction(0)).toBe("stabil");
    expect(direction(0.49)).toBe("stabil");
    expect(direction(-0.49)).toBe("stabil");
    expect(direction(0.5)).toBe("naik");
    expect(direction(-0.6)).toBe("turun");
  });
});

describe("summarize & normalizeSeries", () => {
  it("menghitung tertinggi, terendah, rata-rata", () => {
    const s = summarize(series)!;
    expect(s.max).toEqual(p("2026-10-28", 99400));
    expect(s.min).toEqual(p("2026-10-19", 95000));
    expect(s.avg).toBe(Math.round(series.reduce((a, x) => a + x.price, 0) / series.length));
    expect(s.count).toBe(series.length);
    expect(summarize([])).toBeNull();
  });

  it("mengurutkan dan membuang tanggal ganda", () => {
    expect(normalizeSeries([p("2026-10-30", 2), p("2026-10-28", 1), p("2026-10-30", 3)])).toEqual([
      p("2026-10-28", 1),
      p("2026-10-30", 3),
    ]);
  });
});
