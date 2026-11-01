import { describe, expect, it } from "vitest";
import { describeCondition, evaluateCondition, isEligibleToSend, type AlertSendState } from "@/lib/alerts/conditions";
import type { PricePoint } from "@/lib/prices/calc";

const p = (date: string, price: number): PricePoint => ({ date, price });

const rising: PricePoint[] = [
  p("2026-10-22", 80000),
  p("2026-10-23", 80000),
  p("2026-10-26", 84000),
  p("2026-10-29", 90000),
  p("2026-10-30", 92000),
];

describe("evaluateCondition", () => {
  it("above: terpenuhi hanya jika harga lebih besar dari ambang", () => {
    expect(evaluateCondition({ type: "above", threshold: 90000 }, rising)?.met).toBe(true);
    expect(evaluateCondition({ type: "above", threshold: 92000 }, rising)?.met).toBe(false);
  });

  it("pct7d: membandingkan dengan harga 7 hari lalu", () => {
    // 30 Okt vs 23 Okt: 92.000 vs 80.000 = +15%
    const result = evaluateCondition({ type: "pct7d", threshold: 10 }, rising)!;
    expect(result.met).toBe(true);
    expect(result.reference).toEqual(p("2026-10-23", 80000));
    expect(result.changePct).toBeCloseTo(15, 5);
    expect(evaluateCondition({ type: "pct7d", threshold: 15 }, rising)?.met).toBe(false);
  });

  it("pct7d: tidak terpenuhi bila tidak ada pembanding 7 hari", () => {
    expect(evaluateCondition({ type: "pct7d", threshold: 1 }, [p("2026-10-30", 92000)])?.met).toBe(false);
  });

  it("tanpa data → null", () => {
    expect(evaluateCondition({ type: "above", threshold: 1 }, [])).toBeNull();
  });
});

describe("isEligibleToSend", () => {
  const active: AlertSendState = {
    confirmedAt: new Date("2026-10-20T03:00:00Z"),
    unsubscribedAt: null,
    lastSentAt: null,
    lastSentDataDate: null,
  };
  // Sabtu 31 Okt 2026, 09:00 WIB
  const saturdayMorning = new Date("2026-10-31T02:00:00Z");

  it("alert aktif yang belum pernah mengirim boleh mengirim", () => {
    expect(isEligibleToSend(active, "2026-10-30", saturdayMorning)).toBe(true);
  });

  it("belum dikonfirmasi atau sudah berhenti → tidak mengirim", () => {
    expect(isEligibleToSend({ ...active, confirmedAt: null }, "2026-10-30", saturdayMorning)).toBe(false);
    expect(isEligibleToSend({ ...active, unsubscribedAt: new Date() }, "2026-10-30", saturdayMorning)).toBe(false);
  });

  it("data Jumat yang sudah dikirim tidak memicu email ulang di akhir pekan", () => {
    const sentFriday: AlertSendState = {
      ...active,
      lastSentAt: new Date("2026-10-30T02:00:00Z"),
      lastSentDataDate: "2026-10-30",
    };
    expect(isEligibleToSend(sentFriday, "2026-10-30", saturdayMorning)).toBe(false);
    // Senin ada data baru → boleh mengirim lagi
    expect(isEligibleToSend(sentFriday, "2026-11-02", new Date("2026-11-02T02:00:00Z"))).toBe(true);
  });

  it("maksimal satu email per hari menurut tanggal WIB", () => {
    // 01:00 WIB dan 09:00 WIB pada 2 Nov adalah hari yang sama di Jakarta
    const sentEarly: AlertSendState = {
      ...active,
      lastSentAt: new Date("2026-11-01T18:00:00Z"),
      lastSentDataDate: "2026-10-30",
    };
    expect(isEligibleToSend(sentEarly, "2026-11-02", new Date("2026-11-02T02:00:00Z"))).toBe(false);
  });
});

describe("describeCondition", () => {
  it("memformat kondisi dalam Bahasa Indonesia", () => {
    expect(describeCondition({ type: "above", threshold: 80000 })).toBe("harga di atas Rp80.000");
    expect(describeCondition({ type: "pct7d", threshold: 10 })).toBe("naik lebih dari 10% dalam 7 hari");
    expect(describeCondition({ type: "pct7d", threshold: 7.5 })).toBe("naik lebih dari 7,5% dalam 7 hari");
  });
});
