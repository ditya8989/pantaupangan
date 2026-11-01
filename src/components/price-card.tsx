import Link from "next/link";
import { ViewTransition, type CSSProperties } from "react";
import { formatDateId, formatDateShortId } from "@/lib/dates";
import type { PriceChanges } from "@/lib/prices/calc";
import type { Commodity } from "@/lib/reference";
import { DeltaChip } from "./delta";
import { ArrowRightIcon, CommodityIcon } from "./illustrations";
import { Odometer } from "./odometer";
import { Sparkline } from "./sparkline";

type Props = {
  commodity: Commodity;
  changes: PriceChanges | null;
  spark: number[];
  regionSlug: string;
  /** Tanggal data terbaru wilayah; jika kartu ini lebih lama, tanggalnya ditampilkan. */
  regionLatestDate: string | null;
  index: number;
};

export function PriceCard({ commodity, changes, spark, regionSlug, regionLatestDate, index }: Props) {
  const href = `/komoditas/${commodity.slug}${regionSlug === "nasional" ? "" : `?wilayah=${regionSlug}`}`;
  return (
    <li className="anim-rise" style={{ "--i": index } as CSSProperties}>
      <Link
        href={href}
        transitionTypes={["nav-forward"]}
        className="group card relative flex h-full flex-col overflow-hidden rounded-3xl p-4 transition duration-300 ease-out hover:-translate-y-1 hover:border-accent/30 hover:shadow-[var(--shadow-lift)] sm:p-5"
      >
        <div className="flex items-start gap-3">
          <ViewTransition name={`art-${commodity.slug}`} share="morph" default="none">
            <CommodityIcon slug={commodity.slug} size={52} className="hover-wiggle" />
          </ViewTransition>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="font-bold leading-snug tracking-tight">{commodity.name}</h2>
            <p className="mt-0.5 text-xs text-muted">
              {commodity.category} · per {commodity.unit}
            </p>
          </div>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-fg-2 transition duration-300 group-hover:bg-accent group-hover:text-white">
            <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>

        {changes ? (
          <>
            <p className="mt-4 text-[1.85rem] font-extrabold leading-none tracking-tight">
              <Odometer value={changes.latest.price} />
              <span className="ml-1 text-sm font-semibold text-muted">/{commodity.unit}</span>
            </p>
            {regionLatestDate && changes.latest.date !== regionLatestDate ? (
              <p className="mt-1 text-xs text-muted">Data per {formatDateId(changes.latest.date)}</p>
            ) : null}
            <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
              <div className="flex items-center gap-1.5">
                <dt className="text-muted">
                  {changes.vsPrevious ? `vs ${formatDateShortId(changes.vsPrevious.from.date)}` : "vs sebelumnya"}
                </dt>
                <dd>
                  <DeltaChip delta={changes.vsPrevious} />
                </dd>
              </div>
              <div className="flex items-center gap-1.5">
                <dt className="text-muted">7 hari</dt>
                <dd>
                  <DeltaChip delta={changes.vsWeek} />
                </dd>
              </div>
            </dl>
            <div className="-mx-1 mt-auto pt-3">
              <Sparkline values={spark} index={index} />
            </div>
          </>
        ) : (
          <p className="mt-4 rounded-2xl bg-surface-2 px-3 py-4 text-center text-sm text-muted">
            Data tidak tersedia untuk wilayah ini.
          </p>
        )}
      </Link>
    </li>
  );
}
