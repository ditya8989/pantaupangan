import Link from "next/link";
import type { CSSProperties } from "react";
import { formatDateId } from "@/lib/dates";
import { formatRupiah } from "@/lib/format";
import { PROVINCES, findRegionById } from "@/lib/reference";
import { TrendDownIcon, TrendUpIcon } from "./illustrations";

type Item = { regionId: number; price: number };

export function ProvinceRanking({ ranking, date }: { ranking: Item[]; date: string }) {
  if (ranking.length === 0) return null;
  const size = Math.min(5, Math.ceil(ranking.length / 2));
  const expensive = ranking.slice(0, size);
  const cheap = ranking.slice(-size).reverse();
  const max = ranking[0].price;

  return (
    <section aria-labelledby="peringkat" className="reveal mt-10">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="peringkat" className="text-2xl font-extrabold tracking-tight">
            Peringkat provinsi
          </h2>
          <p className="text-sm text-fg-2">Harga pada {formatDateId(date)}</p>
        </div>
        <p className="text-xs text-muted">
          {ranking.length} dari {PROVINCES.length} provinsi melaporkan harga
        </p>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <RankList title="Termahal" items={expensive} max={max} tone="up" />
        <RankList title="Termurah" items={cheap} max={max} tone="down" />
      </div>
    </section>
  );
}

function RankList({ title, items, max, tone }: { title: string; items: Item[]; max: number; tone: "up" | "down" }) {
  const Icon = tone === "up" ? TrendUpIcon : TrendDownIcon;
  return (
    <div className="card rounded-3xl p-5">
      <h3 className={`inline-flex items-center gap-1.5 text-sm font-bold ${tone === "up" ? "text-up" : "text-down"}`}>
        <Icon className="size-4" />
        {title}
      </h3>
      <ol className="mt-3 space-y-3">
        {items.map((item, i) => {
          const region = findRegionById(item.regionId);
          if (!region) return null;
          return (
            <li key={item.regionId}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="flex items-baseline gap-2.5">
                  <span className="w-4 text-right text-xs font-bold tabular-nums text-muted">{i + 1}</span>
                  <Link href={`/wilayah/${region.slug}`} className="font-medium hover:text-accent hover:underline">
                    {region.name}
                  </Link>
                </span>
                <span className="font-bold tabular-nums">{formatRupiah(item.price)}</span>
              </div>
              {/* Batang relatif terhadap provinsi termahal; satu warna (besaran, bukan status). */}
              <div className="ml-6.5 mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="anim-grow h-full rounded-r-full bg-accent/80"
                  style={{ width: `${Math.max(4, (item.price / max) * 100)}%`, "--i": i } as CSSProperties}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
