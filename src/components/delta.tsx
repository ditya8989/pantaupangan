import { formatPercentDelta, formatRupiahDelta } from "@/lib/format";
import type { Direction, PriceDelta } from "@/lib/prices/calc";

const TEXT_TONE: Record<Direction, string> = {
  naik: "text-up",
  turun: "text-down",
  stabil: "text-fg-2",
};

const CHIP_TONE: Record<Direction, string> = {
  naik: "bg-up-soft text-up",
  turun: "bg-down-soft text-down",
  stabil: "bg-surface-2 text-fg-2",
};

export function DirectionIcon({ direction, className = "size-3" }: { direction: Direction; className?: string }) {
  if (direction === "stabil") {
    return (
      <svg viewBox="0 0 12 12" aria-hidden="true" className={className}>
        <rect x="1.5" y="5" width="9" height="2" rx="1" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className={className}>
      <path d={direction === "naik" ? "M6 1.8l4.6 7.2H1.4z" : "M6 10.2L1.4 3h9.2z"} fill="currentColor" />
    </svg>
  );
}

/** Perubahan harga sebagai teks: ikon + tanda +/− + warna (tidak bergantung pada warna saja). */
export function Delta({ delta, showAbsolute = true }: { delta: PriceDelta | null; showAbsolute?: boolean }) {
  if (!delta) return <span className="text-muted">—</span>;
  const percent = formatPercentDelta(delta.pct);
  return (
    <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${TEXT_TONE[delta.direction]}`}>
      <DirectionIcon direction={delta.direction} />
      {delta.direction === "stabil" ? (
        <span>
          Stabil <span className="font-normal">({percent})</span>
        </span>
      ) : (
        <span>
          <span className="sr-only">{delta.direction} </span>
          {showAbsolute ? (
            <>
              {formatRupiahDelta(delta.abs)} <span className="font-normal">({percent})</span>
            </>
          ) : (
            percent
          )}
        </span>
      )}
    </span>
  );
}

/** Versi "pil" berwarna lembut untuk kartu & ticker. */
export function DeltaChip({
  delta,
  showAbsolute = false,
  size = "sm",
}: {
  delta: PriceDelta | null;
  showAbsolute?: boolean;
  size?: "sm" | "md";
}) {
  const pad = size === "md" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs";
  if (!delta) return <span className={`inline-flex rounded-full bg-surface-2 text-muted ${pad}`}>—</span>;
  const percent = formatPercentDelta(delta.pct);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold tabular-nums ${CHIP_TONE[delta.direction]} ${pad}`}
    >
      <DirectionIcon direction={delta.direction} className={size === "md" ? "size-3" : "size-2.5"} />
      <span className="sr-only">{delta.direction} </span>
      {delta.direction === "stabil" ? `Stabil ${percent}` : showAbsolute ? `${formatRupiahDelta(delta.abs)} (${percent})` : percent}
    </span>
  );
}
