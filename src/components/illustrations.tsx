import type { CSSProperties } from "react";

/**
 * Ilustrasi flat untuk tiap komoditas, dikirim sekali per halaman sebagai sprite SVG
 * (<symbol>) lalu dipakai ulang lewat <use>. Semua dekoratif (aria-hidden).
 */

/** Latar berwarna lembut per komoditas (terang / gelap). Ditulis lengkap agar terbaca Tailwind. */
const TINTS: Record<string, string> = {
  "beras-super-1": "bg-[#e6f0fd] dark:bg-[#16263a]",
  "beras-medium-1": "bg-[#fdebe2] dark:bg-[#36211a]",
  "cabai-merah-keriting": "bg-[#fde6e6] dark:bg-[#3a1b1b]",
  "cabai-rawit-merah": "bg-[#ffe9dd] dark:bg-[#3a2016]",
  "bawang-merah": "bg-[#f8e4ee] dark:bg-[#35192a]",
  "bawang-putih": "bg-[#f1ece2] dark:bg-[#2c2822]",
  "minyak-goreng-kemasan": "bg-[#fef4d2] dark:bg-[#352d13]",
  "gula-pasir-lokal": "bg-[#e8f1fb] dark:bg-[#1b2733]",
  "telur-ayam-ras": "bg-[#fbf0e0] dark:bg-[#33281a]",
  "daging-ayam-ras": "bg-[#fbe9dc] dark:bg-[#36231a]",
};

export function CommodityIcon({
  slug,
  size = 48,
  className = "",
  tinted = true,
  style,
}: {
  slug: string;
  size?: number;
  className?: string;
  tinted?: boolean;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center rounded-[28%] ${tinted ? (TINTS[slug] ?? "bg-surface-2") : ""} ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      <svg width={Math.round(size * 0.8)} height={Math.round(size * 0.8)} viewBox="0 0 64 64">
        <use href={`#art-${slug}`} />
      </svg>
    </span>
  );
}

export function BellArt({ size = 64, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <use href="#art-bell" />
    </svg>
  );
}

function RiceBowl({ id, bowl, rim, band }: { id: string; bowl: string; rim: string; band: string }) {
  return (
    <symbol id={id} viewBox="0 0 64 64">
      <path d="M11 33c1-9 9-17 21-17s20 8 21 17z" fill="#fffdf6" stroke="#e6dcc6" strokeWidth="1.2" />
      <g fill="#e3d8be">
        <ellipse cx="23" cy="26" rx="2.1" ry="1.1" transform="rotate(-25 23 26)" />
        <ellipse cx="31" cy="21" rx="2.1" ry="1.1" transform="rotate(10 31 21)" />
        <ellipse cx="39" cy="25" rx="2.1" ry="1.1" transform="rotate(30 39 25)" />
        <ellipse cx="29" cy="28.5" rx="2.1" ry="1.1" transform="rotate(-5 29 28.5)" />
        <ellipse cx="44.5" cy="30" rx="2.1" ry="1.1" transform="rotate(15 44.5 30)" />
        <ellipse cx="18" cy="30" rx="2.1" ry="1.1" transform="rotate(-35 18 30)" />
      </g>
      <path d="M8 32h48a24 20 0 0 1-48 0z" fill={bowl} />
      <path d="M8 32h48" stroke={rim} strokeWidth="4" strokeLinecap="round" />
      <path d="M15 41c10 5 24 5 34 0" fill="none" stroke={band} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M13 36c1 4 3 7 6 9" fill="none" stroke="#ffffff" strokeOpacity=".35" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="23" y="50" width="18" height="6" rx="3" fill={rim} />
    </symbol>
  );
}

/** Sprite berisi semua ilustrasi; dirender sekali di root layout. */
export function IllustrationSprite() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute", overflow: "hidden" }}>
      <RiceBowl id="art-beras-super-1" bowl="#3b7dd8" rim="#2a5fa8" band="#a8c8f0" />
      <RiceBowl id="art-beras-medium-1" bowl="#d0683f" rim="#a84d2a" band="#f3b89d" />

      <symbol id="art-cabai-merah-keriting" viewBox="0 0 64 64">
        <path
          d="M21 17c6-1 9 4 10 10 1 7 3 13 9 18 4 3 9 5 13 5-4 4-12 5-19 1-7-4-10-11-11-18-1-6-2-11-6-14z"
          fill="#d7263d"
        />
        <path d="M26 23c1.5 4 2 9 4 14 1.5 3.5 4 6.5 7 9" fill="none" stroke="#ff8a8a" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M16 19c1-4 5-6 8-5 2 1 2 3.5 0 4.5-2.5 1.5-6 1.5-8 .5z" fill="#3f9142" />
        <path d="M18 15c-1-4-3-7-7-9" fill="none" stroke="#3f9142" strokeWidth="3" strokeLinecap="round" />
      </symbol>

      <symbol id="art-cabai-rawit-merah" viewBox="0 0 64 64">
        <path d="M21 21c4.5-1 7.5 3 8.5 9s0 13-3.5 20c-3.5-5-6.5-11-7.5-17-.8-5 .2-9.5 2.5-12z" fill="#ef4423" />
        <path d="M23.5 26c.5 4 .5 9-.5 14" fill="none" stroke="#ff9a7a" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M19.5 22c.5-2.5 3-4 5.5-3.5 1.5.5 1.5 2.5 0 3.2-2 1-4.2 1-5.5.3z" fill="#3f9142" />
        <path d="M22.5 19c0-4 1.5-7 4.5-9" fill="none" stroke="#3f9142" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M40 17c4.5 0 6.5 4.5 6.5 10.5S44.5 41 40.5 47c-2.5-5.5-4.5-12.5-4.5-18.5 0-5 1.2-9.5 4-11.5z" fill="#c81d25" />
        <path d="M42.5 22c.8 4 .6 9-.6 14" fill="none" stroke="#f26b6b" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M37.5 18c.8-2.5 3.5-3.6 5.8-2.8 1.4.6 1.2 2.6-.3 3.1-2 .8-4.2.6-5.5-.3z" fill="#3f9142" />
        <path d="M41.5 15.5c1-4 3-6.5 6.5-7.5" fill="none" stroke="#3f9142" strokeWidth="2.6" strokeLinecap="round" />
      </symbol>

      <symbol id="art-bawang-merah" viewBox="0 0 64 64">
        <path
          d="M32 9c2 6 6 9 10 13 5 5 8 11 7 18-1 9-8 15-17 15S16 49 15 40c-1-7 2-13 7-18 4-4 8-7 10-13z"
          fill="#b23a6a"
        />
        <path
          d="M32 14c-3 8-9 12-10 22-.6 6 2 12 6 16M32 14c3 8 9 12 10 22 .6 6-2 12-6 16M32 16v36"
          fill="none"
          stroke="#d86b96"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path d="M21 34c0 5 1.5 9 4 12" fill="none" stroke="#ffffff" strokeOpacity=".35" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M32 9c-.5-2-.5-4 .5-6" stroke="#8c5a2b" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M27 55l-2 4M32 55v5M37 55l2 4" stroke="#cdb88e" strokeWidth="2" strokeLinecap="round" />
      </symbol>

      <symbol id="art-bawang-putih" viewBox="0 0 64 64">
        <path
          d="M32 10c1 5 5 8 11 12 6 4 10 10 9 18-1 9-9 15-20 15S13 49 12 40c-1-8 3-14 9-18 6-4 10-7 11-12z"
          fill="#f8f4ec"
          stroke="#d8ccb4"
          strokeWidth="1.5"
        />
        <path
          d="M32 16c-4 7-10 11-11 21-.5 6 2 11 5 15M32 16c4 7 10 11 11 21 .5 6-2 11-5 15M32 18v34"
          fill="none"
          stroke="#dccfb8"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path d="M24 30c-2 4-2 9 0 13M40 30c2 4 2 9 0 13" fill="none" stroke="#ecc7d0" strokeWidth="2" strokeLinecap="round" />
        <path d="M32 10c0-3 1-5 2.5-7" stroke="#b9a57e" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M26 55l-2 4M32 55v5M38 55l2 4" stroke="#c9b68f" strokeWidth="2" strokeLinecap="round" />
      </symbol>

      <symbol id="art-minyak-goreng-kemasan" viewBox="0 0 64 64">
        <rect x="26.5" y="4" width="11" height="7" rx="2" fill="#2f8f46" />
        <path
          d="M28 11h8v5c0 2 7 5 7 12v25c0 3-2 5-5 5H26c-3 0-5-2-5-5V28c0-7 7-10 7-12z"
          fill="#ffcf3a"
          stroke="#e2ad1c"
          strokeWidth="1.2"
        />
        <path d="M28 11h8v5c0 2 7 5 7 12v3H21v-3c0-7 7-10 7-12z" fill="#fff3c4" />
        <rect x="23.5" y="35" width="17" height="13" rx="3" fill="#ffffff" />
        <path d="M32 37.5c2.5 3 4 5 4 6.5a4 4 0 0 1-8 0c0-1.5 1.5-3.5 4-6.5z" fill="#f08a24" />
        <path d="M24.5 30v4M24.5 50v4" stroke="#fffbe6" strokeWidth="2.5" strokeLinecap="round" />
      </symbol>

      <symbol id="art-gula-pasir-lokal" viewBox="0 0 64 64">
        {[
          [21, 31],
          [43, 31],
          [32, 15],
        ].map(([x, y]) => (
          <g key={`${x}-${y}`} stroke="#b9c8dc" strokeWidth="1" strokeLinejoin="round">
            <path d={`M${x} ${y}l10 5.8-10 5.8-10-5.8z`} fill="#ffffff" />
            <path d={`M${x - 10} ${y + 5.8}l10 5.8v12l-10-5.8z`} fill="#e3ebf5" />
            <path d={`M${x} ${y + 11.6}l10-5.8v12l-10 5.8z`} fill="#c9d7ea" />
          </g>
        ))}
        <g fill="#ffffff">
          <circle cx="50" cy="13" r="1.6" />
          <circle cx="13" cy="20" r="1.2" />
          <circle cx="54" cy="24" r="1" />
        </g>
      </symbol>

      <symbol id="art-telur-ayam-ras" viewBox="0 0 64 64">
        <path d="M39 11c8 0 14 12 14 22 0 9-6 15-14 15s-14-6-14-15c0-10 6-22 14-22z" fill="#dca673" />
        <ellipse cx="34" cy="21" rx="2.5" ry="4.2" fill="#ecc497" />
        <path
          d="M25 19c8 0 14 12 14 21 0 9-6 15-14 15s-14-6-14-15c0-9 6-21 14-21z"
          fill="#fdf4e6"
          stroke="#e8d2b4"
          strokeWidth="1.3"
        />
        <ellipse cx="19.5" cy="33" rx="3" ry="5.5" fill="#ffffff" />
      </symbol>

      <symbol id="art-daging-ayam-ras" viewBox="0 0 64 64">
        {/* Tulang: lapisan bawah lebih gelap sebagai garis tepi agar terlihat di latar krem. */}
        <path d="M36 38l12 12" stroke="#d5bf99" strokeWidth="9.5" strokeLinecap="round" />
        <circle cx="52" cy="49" r="5.6" fill="#d5bf99" />
        <circle cx="47" cy="54" r="5.6" fill="#d5bf99" />
        <path d="M36 38l12 12" stroke="#fbf6ec" strokeWidth="6.5" strokeLinecap="round" />
        <circle cx="52" cy="49" r="4.2" fill="#fbf6ec" />
        <circle cx="47" cy="54" r="4.2" fill="#fbf6ec" />
        <path
          d="M28 9c11 0 19 8 19 18 0 6-3 10-8 13l-5 4c-2.5 2-6 2.5-9 1C16 42 9 35 9 26 9 16 17 9 28 9z"
          fill="#c8682f"
        />
        <path d="M15 24c1.5-6.5 7-11 14-11" fill="none" stroke="#ec9a5c" strokeWidth="3" strokeLinecap="round" />
        <path d="M20 35c4 3 9 4 13 3M24 29c3 1.5 6 2 9 1.5" fill="none" stroke="#a9521f" strokeWidth="1.8" strokeLinecap="round" />
      </symbol>

      <symbol id="art-bell" viewBox="0 0 64 64">
        <path d="M8 22c1-5 4-9 8-12M56 22c-1-5-4-9-8-12" fill="none" stroke="#fb923c" strokeWidth="3" strokeLinecap="round" />
        <path
          d="M32 7c2 0 3.5 1.5 3.5 3.5V12c8 2.5 13 9.5 13 18v10l5 7h-43l5-7V30c0-8.5 5-15.5 13-18v-1.5C28.5 8.5 30 7 32 7z"
          fill="#f59e0b"
        />
        <path d="M21 30c0-6.5 4-11.5 9.5-12.5" fill="none" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" />
        <path d="M10.5 47h43" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
        <circle cx="32" cy="53" r="5" fill="#c2410c" />
      </symbol>
    </svg>
  );
}

/* ───────────── Ikon UI garis (24×24, mengikuti currentColor) ───────────── */

type IconProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function PinIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
      <path d="M12 21s-6.5-5.8-6.5-11.2a6.5 6.5 0 1 1 13 0C18.5 15.2 12 21 12 21z" />
      <circle cx="12" cy="9.8" r="2.3" />
    </svg>
  );
}

export function ChevronDownIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function ArrowRightIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function ArrowLeftIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function TrendUpIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
      <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />
    </svg>
  );
}

export function TrendDownIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
      <path d="M3 7l6 6 4-4 8 8M15 17h6v-6" />
    </svg>
  );
}

export function SparkIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  );
}

export function BellIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
      <path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function MailIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  );
}

export function CheckIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function DownloadIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
      <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />
    </svg>
  );
}

export function ShareIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
      <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5z" />
      <path d="M9 10.5c.5 2 2 3.5 4 4.2" />
    </svg>
  );
}

export function PauseIcon({ className = "size-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
      <path d="M9 6v12M15 6v12" />
    </svg>
  );
}

export function PlayIcon({ className = "size-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
      <path d="M8 5.5v13l10-6.5z" />
    </svg>
  );
}
