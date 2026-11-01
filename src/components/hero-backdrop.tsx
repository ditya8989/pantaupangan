import type { CSSProperties } from "react";

/** Latar hero: tiga cahaya gradien yang bergerak pelan (radial-gradient, tanpa filter blur yang berat). */
export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="anim-blob absolute -left-24 -top-28 size-[26rem] rounded-full bg-[radial-gradient(closest-side,var(--glow-1),transparent)]"
        style={{ "--dur": "20s" } as CSSProperties}
      />
      <div
        className="anim-blob absolute -right-20 -top-10 size-[22rem] rounded-full bg-[radial-gradient(closest-side,var(--glow-2),transparent)]"
        style={{ "--dur": "24s" } as CSSProperties}
      />
      <div
        className="anim-blob absolute -bottom-40 left-1/4 size-[28rem] rounded-full bg-[radial-gradient(closest-side,var(--glow-3),transparent)]"
        style={{ "--dur": "28s" } as CSSProperties}
      />
    </div>
  );
}

/** Coretan tangan di bawah teks penting; tergambar sekali saat dimuat. */
export function Squiggle({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 14"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`pointer-events-none absolute -bottom-2.5 left-0 h-3.5 w-full text-accent-strong ${className}`}
    >
      <path
        d="M3 9c30-6 52-6 78-1s50 6 76 0 45-6 60-2"
        pathLength={100}
        className="draw-in"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Titik "live" yang berdenyut. */
export function LiveDot({ className = "bg-down" }: { className?: string }) {
  return (
    <span className="relative inline-flex size-2" aria-hidden="true">
      <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 ${className}`} />
      <span className={`relative inline-flex size-2 rounded-full ${className}`} />
    </span>
  );
}
