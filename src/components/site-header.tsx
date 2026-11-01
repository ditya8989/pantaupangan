import Link from "next/link";
import { NavLinks } from "./nav-links";

export function SiteHeader() {
  return (
    <header
      style={{ viewTransitionName: "site-header" }}
      className="sticky top-0 z-40 border-b border-line bg-page/80 backdrop-blur-md backdrop-saturate-150"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="PantauPangan, ke beranda">
          <LogoMark />
          <span className="text-lg font-extrabold tracking-tight">
            Pantau<span className="text-accent">Pangan</span>
          </span>
        </Link>
        <NavLinks />
      </div>
    </header>
  );
}

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="shrink-0 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105"
    >
      <rect width="32" height="32" rx="9" className="fill-accent" />
      <path
        d="M7 21.5l5.5-6 4.5 3.5L25 10"
        pathLength={100}
        className="draw-in stroke-white"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="25" cy="10" r="2.6" className="fill-white anim-fade" style={{ animationDelay: "1.2s" }} />
    </svg>
  );
}
