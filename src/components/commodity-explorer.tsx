"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore, type CSSProperties } from "react";
import { SOURCE_NAME, SOURCE_URL } from "@/lib/attribution";
import { addDays, formatDateId, formatDateShortId } from "@/lib/dates";
import { formatPercentDelta, formatRupiah } from "@/lib/format";
import { computeChanges, summarize, type PricePoint } from "@/lib/prices/calc";
import type { CommodityDetail } from "@/lib/prices/queries";
import { readStoredRegionSlug, storeRegionSlug } from "@/lib/region-preference";
import { NATIONAL_ID, REGIONS, findRegionById, findRegionBySlug } from "@/lib/reference";
import { DeltaChip } from "./delta";
import { LiveDot } from "./hero-backdrop";
import { BellIcon, ChevronDownIcon, DownloadIcon, PinIcon, ShareIcon } from "./illustrations";
import { Odometer } from "./odometer";
import { SERIES_COLORS, TrendChart, usePrefersDark, type ChartSeries } from "./trend-chart";

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];
const MAX_SERIES = 3;

type Selected = { regionId: number; slot: number };

type Props = {
  commodity: { slug: string; name: string; unit: string };
  detail: CommodityDetail;
};

const subscribeNothing = () => () => {};

/** Wilayah awal: ?wilayah= di URL (tautan yang dibagikan), lalu pilihan tersimpan, lalu Nasional. */
function readPreferredSlug(): string | null {
  const fromUrl = new URLSearchParams(window.location.search).get("wilayah");
  if (fromUrl && findRegionBySlug(fromUrl)) return fromUrl;
  return readStoredRegionSlug();
}

function freeSlot(selection: Selected[]): number {
  for (let slot = 0; slot < MAX_SERIES; slot++) if (!selection.some((s) => s.slot === slot)) return slot;
  return 0;
}

export function CommodityExplorer({ commodity, detail }: Props) {
  const [range, setRange] = useState<Range>(30);
  const [userSelection, setUserSelection] = useState<Selected[] | null>(null);
  const preferredSlug = useSyncExternalStore(subscribeNothing, readPreferredSlug, () => null);
  const dark = usePrefersDark();
  const palette = SERIES_COLORS[dark ? "dark" : "light"];

  const valuesByRegion = useMemo(
    () => new Map(detail.series.map((s) => [s.regionId, s.prices])),
    [detail.series],
  );
  const regionsWithData = REGIONS.filter((r) => valuesByRegion.has(r.id));

  const selection: Selected[] = useMemo(() => {
    if (userSelection) return userSelection;
    const preferred = preferredSlug ? findRegionBySlug(preferredSlug) : undefined;
    if (preferred && preferred.id !== NATIONAL_ID && valuesByRegion.has(preferred.id)) {
      return [
        { regionId: preferred.id, slot: 0 },
        { regionId: NATIONAL_ID, slot: 1 },
      ];
    }
    return [{ regionId: NATIONAL_ID, slot: 0 }];
  }, [userSelection, preferredSlug, valuesByRegion]);

  const primaryId = selection[0].regionId;
  const primary = findRegionById(primaryId)!;

  const pointsFor = (regionId: number, fromIndex = 0): PricePoint[] => {
    const values = valuesByRegion.get(regionId) ?? [];
    const points: PricePoint[] = [];
    for (let i = fromIndex; i < detail.dates.length; i++) {
      const price = values[i];
      if (price !== null && price !== undefined) points.push({ date: detail.dates[i], price });
    }
    return points;
  };

  const primaryChanges = computeChanges(pointsFor(primaryId));
  const startDate = detail.latestDate ? addDays(detail.latestDate, -range) : "";
  const startIndex = Math.max(0, detail.dates.findIndex((d) => d >= startDate));
  const visibleDates = detail.dates.slice(startIndex);

  const chartSeries: ChartSeries[] = selection.map((s) => ({
    key: `r${s.regionId}`,
    name: findRegionById(s.regionId)?.name ?? "?",
    slot: s.slot,
    values: (valuesByRegion.get(s.regionId) ?? []).slice(startIndex),
  }));

  function choosePrimary(regionId: number) {
    const region = findRegionById(regionId);
    if (!region) return;
    storeRegionSlug(region.slug);
    const url = new URL(window.location.href);
    if (region.id === NATIONAL_ID) url.searchParams.delete("wilayah");
    else url.searchParams.set("wilayah", region.slug);
    window.history.replaceState(null, "", url);

    const existing = selection.find((s) => s.regionId === regionId);
    if (existing) {
      // Sudah ada sebagai pembanding: jadikan utama, warnanya tetap.
      setUserSelection([existing, ...selection.filter((s) => s.regionId !== regionId)]);
    } else {
      setUserSelection([{ regionId, slot: selection[0].slot }, ...selection.slice(1)]);
    }
  }

  function addComparison(regionId: number) {
    if (selection.length >= MAX_SERIES || selection.some((s) => s.regionId === regionId)) return;
    setUserSelection([...selection, { regionId, slot: freeSlot(selection) }]);
  }

  function removeComparison(regionId: number) {
    setUserSelection(selection.filter((s, i) => i === 0 || s.regionId !== regionId));
  }

  const csvHref = `/api/csv?komoditas=${commodity.slug}&wilayah=${selection
    .map((s) => findRegionById(s.regionId)?.slug)
    .join(",")}&hari=${range}`;

  const shareText = primaryChanges
    ? `Harga ${commodity.name} di ${primary.name} per ${formatDateId(primaryChanges.latest.date)}: ${formatRupiah(
        primaryChanges.latest.price,
      )}/${commodity.unit}${
        primaryChanges.vsWeek ? ` (${formatPercentDelta(primaryChanges.vsWeek.pct)} dalam 7 hari)` : ""
      }.`
    : `Harga ${commodity.name} di ${primary.name}.`;

  return (
    <div className="space-y-6">
      {/* Harga wilayah utama */}
      <section
        aria-label={`Harga di ${primary.name}`}
        className="anim-rise card relative overflow-hidden rounded-3xl p-5 sm:p-7"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-[radial-gradient(closest-side,var(--glow-1),transparent)] opacity-70"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <label className="relative inline-flex h-11 items-center rounded-full bg-surface-2 ring-1 ring-line focus-within:ring-2 focus-within:ring-accent">
            <PinIcon className="pointer-events-none absolute left-3.5 size-4 text-accent" />
            <span className="sr-only">Wilayah utama</span>
            <select
              value={primaryId}
              onChange={(e) => choosePrimary(Number(e.target.value))}
              className="h-full cursor-pointer appearance-none rounded-full bg-transparent pl-9 pr-9 text-base font-semibold text-fg focus:outline-none"
            >
              {regionsWithData.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3.5 size-4 text-muted" />
          </label>
          {primaryChanges ? (
            <p className="inline-flex items-center gap-2 text-xs font-semibold text-fg-2">
              <LiveDot />
              Data per {formatDateId(primaryChanges.latest.date)}
            </p>
          ) : null}
        </div>

        {primaryChanges ? (
          <div className="relative">
            <p className="mt-5 text-5xl font-extrabold leading-none tracking-tight sm:text-6xl">
              <Odometer key={`${primaryId}-${primaryChanges.latest.price}`} value={primaryChanges.latest.price} />
              <span className="ml-1.5 text-lg font-semibold text-muted">/{commodity.unit}</span>
            </p>
            <dl className="mt-5 flex flex-wrap gap-2.5 text-sm">
              <div className="flex items-center gap-2 rounded-2xl bg-surface-2/70 py-1.5 pl-3 pr-1.5">
                <dt className="text-muted">
                  vs {primaryChanges.vsPrevious ? formatDateShortId(primaryChanges.vsPrevious.from.date) : "sebelumnya"}
                </dt>
                <dd>
                  <DeltaChip delta={primaryChanges.vsPrevious} showAbsolute size="md" />
                </dd>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-surface-2/70 py-1.5 pl-3 pr-1.5">
                <dt className="text-muted">vs 7 hari lalu</dt>
                <dd>
                  <DeltaChip delta={primaryChanges.vsWeek} showAbsolute size="md" />
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">Data tidak tersedia untuk wilayah ini.</p>
        )}
      </section>

      {/* Grafik: kontrol dalam satu baris di atas grafik */}
      <section
        aria-label="Grafik tren harga"
        className="anim-rise card rounded-3xl p-4 sm:p-6"
        style={{ "--i": 1 } as CSSProperties}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-extrabold tracking-tight">Tren harga</h2>
          <div role="group" aria-label="Rentang waktu" className="inline-flex w-fit rounded-full bg-surface-2 p-1">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={range === r}
                onClick={() => setRange(r)}
                className={`h-9 rounded-full px-4 text-sm font-semibold transition duration-200 ${
                  range === r ? "bg-accent text-white shadow-sm" : "text-fg-2 hover:text-fg"
                }`}
              >
                {r} hari
              </button>
            ))}
          </div>
        </div>

        {/* Legenda + pembanding (maks. 3 garis) */}
        <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Wilayah di grafik">
          {selection.map((s, i) => {
            const region = findRegionById(s.regionId)!;
            return (
              <span
                key={s.regionId}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-surface-2/70 pl-3 pr-1 text-sm ring-1 ring-line"
              >
                <span
                  aria-hidden="true"
                  className="h-1 w-4 rounded-full"
                  style={{ backgroundColor: palette[s.slot % palette.length] }}
                />
                <span className={i === 0 ? "font-semibold" : ""}>{region.name}</span>
                {i > 0 ? (
                  <button
                    type="button"
                    onClick={() => removeComparison(s.regionId)}
                    aria-label={`Hapus ${region.name} dari grafik`}
                    className="grid size-7 place-items-center rounded-full text-muted transition hover:bg-surface hover:text-up"
                  >
                    <svg viewBox="0 0 12 12" className="size-3" aria-hidden="true">
                      <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                ) : (
                  <span className="pr-2" />
                )}
              </span>
            );
          })}
          {selection.length < MAX_SERIES ? (
            <label className="relative inline-flex">
              <span className="sr-only">Tambah wilayah pembanding</span>
              <select
                value=""
                onChange={(e) => e.target.value && addComparison(Number(e.target.value))}
                className="h-9 cursor-pointer rounded-full border border-dashed border-accent/50 bg-transparent px-3.5 text-sm font-semibold text-accent"
              >
                <option value="">+ Bandingkan wilayah</option>
                {regionsWithData
                  .filter((r) => !selection.some((s) => s.regionId === r.id))
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </label>
          ) : (
            <span className="text-xs text-muted">Maksimal 3 wilayah</span>
          )}
        </div>

        <div className="mt-4">
          <TrendChart
            dates={visibleDates}
            series={chartSeries}
            ariaLabel={`Grafik harga ${commodity.name} ${range} hari terakhir: ${chartSeries.map((s) => s.name).join(", ")}`}
          />
          <p className="mt-2 text-xs text-muted">
            Sumber:{" "}
            <a href={SOURCE_URL} className="underline underline-offset-2 hover:text-accent" rel="noopener">
              {SOURCE_NAME}
            </a>{" "}
            (harga konsumen, pasar tradisional)
          </p>
        </div>

        {/* Ringkasan per wilayah dalam rentang terpilih: grid 3 kolom (muat di layar 360px) */}
        <div className="mt-4 border-t border-line">
          <h3 className="pt-3 text-xs font-bold uppercase tracking-[0.12em] text-muted">Ringkasan {range} hari</h3>
          <ul className="divide-y divide-line">
            {selection.map((s) => {
              const summary = summarize(pointsFor(s.regionId, startIndex));
              return (
                <li
                  key={s.regionId}
                  className="grid grid-cols-3 gap-x-3 gap-y-1.5 py-3 text-sm sm:grid-cols-[minmax(9rem,1fr)_repeat(3,minmax(0,8.5rem))] sm:items-center"
                >
                  <p className="col-span-3 flex items-center gap-2 font-semibold sm:col-span-1">
                    <span
                      aria-hidden="true"
                      className="h-1 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: palette[s.slot % palette.length] }}
                    />
                    {findRegionById(s.regionId)?.name}
                  </p>
                  {summary ? (
                    <>
                      <SummaryStat label="Tertinggi" price={summary.max.price} date={summary.max.date} />
                      <SummaryStat label="Terendah" price={summary.min.price} date={summary.min.date} />
                      <SummaryStat label="Rata-rata" price={summary.avg} />
                    </>
                  ) : (
                    <p className="col-span-3 text-muted">Tidak ada data pada rentang ini.</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <details className="group/table mt-2 text-sm">
          <summary className="inline-flex cursor-pointer items-center gap-1.5 rounded-full py-1.5 font-semibold text-fg-2 hover:text-accent">
            <ChevronDownIcon className="size-4 -rotate-90 transition-transform group-open/table:rotate-0" />
            Lihat data dalam tabel
          </summary>
          <div className="mt-2 max-h-80 overflow-auto rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface-2">
                <tr className="text-left text-xs text-muted">
                  <th scope="col" className="px-3 py-2 font-medium">
                    Tanggal
                  </th>
                  {chartSeries.map((s) => (
                    <th key={s.key} scope="col" className="px-3 py-2 text-right font-medium">
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleDates
                  .map((date, i) => ({ date, i }))
                  .reverse()
                  .map(({ date, i }) => (
                    <tr key={date} className="border-t border-line">
                      <th scope="row" className="px-3 py-1.5 text-left font-normal text-fg-2">
                        {formatDateId(date)}
                      </th>
                      {chartSeries.map((s) => (
                        <td key={s.key} className="px-3 py-1.5 text-right tabular-nums">
                          {s.values[i] !== null ? formatRupiah(s.values[i] as number) : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      {/* Aksi */}
      <div className="anim-rise flex flex-wrap gap-2.5" style={{ "--i": 2 } as CSSProperties}>
        <Link
          href={`/peringatan?komoditas=${commodity.slug}&wilayah=${primary.slug}`}
          className="group inline-flex h-12 items-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-white shadow-[var(--shadow-lift)] transition hover:-translate-y-0.5"
        >
          <BellIcon className="size-4 group-hover:animate-[ring_1s_ease-in-out]" />
          Pasang peringatan
        </Link>
        <a
          href={csvHref}
          download
          className="card inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-bold transition hover:-translate-y-0.5 hover:border-accent/40"
        >
          <DownloadIcon />
          Unduh CSV
        </a>
        <ShareButton text={shareText} path={`/komoditas/${commodity.slug}?wilayah=${primary.slug}`} />
      </div>
    </div>
  );
}

function SummaryStat({ label, price, date }: { label: string; price: number; date?: string }) {
  return (
    <div className="sm:text-right">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-bold tabular-nums">{formatRupiah(price)}</p>
      {date ? <p className="text-xs text-muted">{formatDateShortId(date)}</p> : null}
    </div>
  );
}

function ShareButton({ text, path }: { text: string; path: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        const url = `${window.location.origin}${path}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} Pantau di PantauPangan: ${url}`)}`, "_blank", "noopener");
      }}
      className="card inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-bold transition hover:-translate-y-0.5 hover:border-accent/40"
    >
      <ShareIcon />
      Bagikan ke WhatsApp
    </button>
  );
}
