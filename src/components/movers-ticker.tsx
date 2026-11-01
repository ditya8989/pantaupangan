"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { formatRupiah } from "@/lib/format";
import type { PriceDelta } from "@/lib/prices/calc";
import { DeltaChip } from "./delta";
import { CommodityIcon, PauseIcon, PlayIcon } from "./illustrations";

export type TickerItem = { slug: string; name: string; price: number; delta: PriceDelta | null };

/** Ticker berjalan ala papan bursa. Bisa dijeda (WCAG 2.2.2); berhenti saat hover/fokus. */
export function MoversTicker({ items, regionSlug }: { items: TickerItem[]; regionSlug: string }) {
  const [paused, setPaused] = useState(false);
  if (items.length === 0) return null;
  const query = regionSlug === "nasional" ? "" : `?wilayah=${regionSlug}`;

  const renderList = (duplicate: boolean) => (
    <ul
      className={`flex shrink-0 items-center gap-3 pr-3 ${duplicate ? "marquee-duplicate" : ""}`}
      aria-hidden={duplicate || undefined}
    >
      {items.map((item) => (
        <li key={item.slug}>
          <Link
            href={`/komoditas/${item.slug}${query}`}
            transitionTypes={["nav-forward"]}
            tabIndex={duplicate ? -1 : undefined}
            className="card inline-flex items-center gap-2 whitespace-nowrap rounded-full py-1.5 pl-1.5 pr-3 text-sm transition hover:border-accent/40"
          >
            <CommodityIcon slug={item.slug} size={28} />
            <span className="font-semibold">{item.name}</span>
            <span className="tabular-nums text-fg-2">{formatRupiah(item.price)}</span>
            <DeltaChip delta={item.delta} />
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-labelledby="ticker-title" className="anim-fade" style={{ "--delay": "0.3s" } as CSSProperties}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 id="ticker-title" className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
          Pergerakan 7 hari
        </h2>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-fg-2 hover:bg-surface-2 hover:text-fg"
        >
          {paused ? <PlayIcon /> : <PauseIcon />}
          {paused ? "Jalankan" : "Jeda"}
        </button>
      </div>
      <div className="marquee -mx-4 px-4 py-1" data-paused={paused}>
        <div className="marquee-track" style={{ "--marquee-duration": `${items.length * 6}s` } as CSSProperties}>
          {renderList(false)}
          {renderList(true)}
        </div>
      </div>
    </section>
  );
}
