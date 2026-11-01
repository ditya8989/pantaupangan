import Link from "next/link";
import type { CSSProperties } from "react";
import { formatDateShortId } from "@/lib/dates";
import { formatPercentDelta, formatRupiah } from "@/lib/format";
import type { PriceChanges } from "@/lib/prices/calc";
import type { Commodity } from "@/lib/reference";
import { CheckIcon, CommodityIcon, TrendDownIcon, TrendUpIcon } from "./illustrations";

type Entry = { commodity: Commodity; changes: PriceChanges };

/** Dua kartu sorotan: kenaikan & penurunan paling tajam dalam 7 hari. */
export function Highlights({ entries, regionSlug }: { entries: Entry[]; regionSlug: string }) {
  const withWeek = entries.filter((e) => e.changes.vsWeek !== null);
  const sorted = [...withWeek].sort((a, b) => b.changes.vsWeek!.pct - a.changes.vsWeek!.pct);
  const rising = sorted[0]?.changes.vsWeek!.direction === "naik" ? sorted[0] : null;
  const falling = sorted.at(-1)?.changes.vsWeek!.direction === "turun" ? sorted.at(-1)! : null;

  return (
    <section aria-label="Sorotan 7 hari" className="grid gap-3 sm:grid-cols-2">
      <HighlightCard kind="naik" entry={rising} regionSlug={regionSlug} index={0} />
      <HighlightCard kind="turun" entry={falling} regionSlug={regionSlug} index={1} />
    </section>
  );
}

function HighlightCard({
  kind,
  entry,
  regionSlug,
  index,
}: {
  kind: "naik" | "turun";
  entry: Entry | null;
  regionSlug: string;
  index: number;
}) {
  const up = kind === "naik";
  const title = up ? "Naik paling tajam" : "Turun paling dalam";
  const tone = up ? "text-up" : "text-down";
  const wash = up
    ? "bg-[radial-gradient(120%_120%_at_100%_0%,var(--up-soft),transparent_60%)]"
    : "bg-[radial-gradient(120%_120%_at_100%_0%,var(--down-soft),transparent_60%)]";
  const Icon = up ? TrendUpIcon : TrendDownIcon;

  if (!entry) {
    return (
      <div className={`anim-rise card flex items-center gap-4 rounded-3xl p-5 ${wash}`} style={{ "--i": index } as CSSProperties}>
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-fg-2">
          <CheckIcon className="size-6" />
        </span>
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.12em] ${tone}`}>{title}</p>
          <p className="mt-1 text-sm text-fg-2">
            {up ? "Tidak ada kenaikan berarti minggu ini." : "Tidak ada penurunan berarti minggu ini."}
          </p>
        </div>
      </div>
    );
  }

  const week = entry.changes.vsWeek!;
  const query = regionSlug === "nasional" ? "" : `?wilayah=${regionSlug}`;
  return (
    <Link
      href={`/komoditas/${entry.commodity.slug}${query}`}
      transitionTypes={["nav-forward"]}
      className={`anim-rise group card relative flex items-center gap-4 overflow-hidden rounded-3xl p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] ${wash}`}
      style={{ "--i": index } as CSSProperties}
    >
      <div className="min-w-0 flex-1">
        <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] ${tone}`}>
          <Icon className="size-4 shrink-0" />
          {title}
        </p>
        <p className="mt-2 truncate text-lg font-bold tracking-tight">{entry.commodity.name}</p>
        <p className={`mt-0.5 flex items-baseline gap-1.5 text-3xl font-extrabold tracking-tight tabular-nums ${tone}`}>
          <span className="sr-only">{kind} </span>
          {formatPercentDelta(week.pct)}
          <span className="text-sm font-semibold tracking-normal text-muted">dalam 7 hari</span>
        </p>
        <p className="mt-1 text-sm text-fg-2">
          {formatRupiah(week.from.price)} <span className="text-muted">({formatDateShortId(week.from.date)})</span> →{" "}
          <span className="font-semibold text-fg">{formatRupiah(entry.changes.latest.price)}</span>
        </p>
      </div>
      <CommodityIcon
        slug={entry.commodity.slug}
        size={84}
        className="anim-float shadow-[var(--shadow-card)]"
        style={{ "--rot": up ? "-6deg" : "6deg", "--dur": "6.5s" } as CSSProperties}
      />
    </Link>
  );
}
