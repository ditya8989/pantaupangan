/** Utilitas tanggal. Tanggal data disimpan sebagai string ISO "YYYY-MM-DD" (tanggal WIB). */

const JAKARTA_TZ = "Asia/Jakarta";
const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const jakartaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: JAKARTA_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Tanggal hari ini (atau `now`) di zona Asia/Jakarta, format "YYYY-MM-DD". */
export function todayInJakarta(now: Date = new Date()): string {
  return jakartaDateFormatter.format(now);
}

function parseIso(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function addDays(iso: string, days: number): string {
  const d = parseIso(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Selisih hari kalender a − b. */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseIso(a).getTime() - parseIso(b).getTime()) / 86_400_000);
}

export function isWeekend(iso: string): boolean {
  const day = parseIso(iso).getUTCDay();
  return day === 0 || day === 6;
}

/** Semua tanggal kalender dari start s.d. end (inklusif). */
export function dateRange(start: string, end: string): string[] {
  const out: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

export function minDate(a: string, b: string): string {
  return a < b ? a : b;
}

export function maxDate(a: string, b: string): string {
  return a > b ? a : b;
}

/** "2026-11-01" → "1 Nov 2026" */
export function formatDateId(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_ID[m - 1]} ${y}`;
}

/** "2026-10-30" → "30 Okt" */
export function formatDateShortId(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_ID[m - 1]}`;
}

/** Format tanggal PIHPS "DD/MM/YYYY" → "YYYY-MM-DD"; null jika bukan tanggal. */
export function parseSlashDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, d, m, y] = match;
  const iso = `${y}-${m}-${d}`;
  return parseIso(iso).toISOString().slice(0, 10) === iso ? iso : null;
}
