import Link from "next/link";
import { COPYRIGHT_YEAR, SITE_OWNER, SOURCE_FULL_NAME, SOURCE_NAME, SOURCE_URL } from "@/lib/attribution";
import { CommodityIcon } from "./illustrations";
import { LogoMark } from "./site-header";

export function SiteFooter() {
  return (
    <footer className="kawung mt-16 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm text-fg-2 sm:grid-cols-[1.6fr_1fr_1.4fr]">
        <div>
          <p className="flex items-center gap-2.5 text-base font-extrabold tracking-tight text-fg">
            <LogoMark size={30} />
            <span>
              Pantau<span className="text-accent">Pangan</span>
            </span>
          </p>
          <p className="mt-3 max-w-xs leading-relaxed">
            Harga bahan pokok dari pasar tradisional di seluruh Indonesia, diperbarui setiap hari kerja.
          </p>
          <div className="mt-4 flex -space-x-2" aria-hidden="true">
            {["beras-super-1", "cabai-merah-keriting", "bawang-putih", "telur-ayam-ras", "daging-ayam-ras"].map((slug) => (
              <CommodityIcon key={slug} slug={slug} size={34} className="ring-2 ring-surface" />
            ))}
          </div>
        </div>
        <nav aria-label="Tautan footer">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Jelajahi</h2>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/" className="hover:text-accent">
                Harga terbaru
              </Link>
            </li>
            <li>
              <Link href="/peringatan" className="hover:text-accent">
                Pasang peringatan
              </Link>
            </li>
            <li>
              <Link href="/privasi" className="hover:text-accent">
                Kebijakan privasi
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Sumber data</h2>
          <p className="mt-3 leading-relaxed">
            Semua harga di situs ini berasal dari{" "}
            <a href={SOURCE_URL} className="font-semibold text-fg underline underline-offset-2 hover:text-accent" rel="noopener">
              {SOURCE_FULL_NAME}
            </a>
            , yaitu harga konsumen di pasar tradisional. PantauPangan tidak berafiliasi dengan Bank Indonesia.
          </p>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {COPYRIGHT_YEAR} {SITE_OWNER}
          </p>
          <p>
            Data:{" "}
            <a href={SOURCE_URL} className="underline underline-offset-2 hover:text-accent" rel="noopener">
              {SOURCE_NAME}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
