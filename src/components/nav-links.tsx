"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon } from "./illustrations";

const LINKS = [
  { href: "/", label: "Harga", match: (p: string) => p === "/" || p.startsWith("/wilayah") || p.startsWith("/komoditas") },
  { href: "/peringatan", label: "Peringatan", match: (p: string) => p.startsWith("/peringatan") },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigasi utama" className="flex items-center gap-1 rounded-full bg-surface-2/70 p-1 text-sm font-semibold">
      {LINKS.map((link) => {
        const active = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 transition duration-200 ${
              active ? "bg-surface text-fg shadow-sm" : "text-fg-2 hover:text-fg"
            }`}
          >
            {link.href === "/peringatan" ? (
              <>
                <BellIcon className="size-4" />
                {/* Layar sempit: cukup ikon lonceng, label tetap terbaca pembaca layar. */}
                <span className="sr-only sm:not-sr-only">{link.label}</span>
              </>
            ) : (
              link.label
            )}
          </Link>
        );
      })}
    </nav>
  );
}
