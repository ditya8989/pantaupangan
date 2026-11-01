/**
 * Format angka gaya Indonesia. Diimplementasikan manual (bukan Intl) agar hasil
 * server dan browser selalu identik (tidak ada hydration mismatch).
 */

const MINUS = "−";

function groupThousands(n: number): string {
  return Math.round(Math.abs(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** 15510 → "Rp15.510" */
export function formatRupiah(n: number): string {
  return `${n < 0 ? MINUS : ""}Rp${groupThousands(n)}`;
}

/** 1850 → "+Rp1.850", −1850 → "−Rp1.850", 0 → "Rp0" */
export function formatRupiahDelta(n: number): string {
  if (Math.round(n) === 0) return "Rp0";
  return `${n > 0 ? "+" : MINUS}Rp${groupThousands(n)}`;
}

/** 1.94 → "+1,9%", −0.04 → "0,0%" */
export function formatPercentDelta(pct: number): string {
  const rounded = Math.round(pct * 10) / 10;
  if (rounded === 0) return "0,0%";
  const body = Math.abs(rounded).toFixed(1).replace(".", ",");
  return `${rounded > 0 ? "+" : MINUS}${body}%`;
}

/** 12.5 → "12,5" (tanpa tanda). */
export function formatDecimal(n: number, digits = 1): string {
  return n.toFixed(digits).replace(".", ",");
}

/** 15510 → "15.510" */
export function formatNumber(n: number): string {
  return `${n < 0 ? MINUS : ""}${groupThousands(n)}`;
}
