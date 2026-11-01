import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="text-sm font-semibold text-accent">404</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">Halaman tidak ditemukan</h1>
      <p className="mt-2 text-fg-2">Komoditas atau wilayah yang Anda cari tidak ada.</p>
      <Link
        href="/"
        className="mt-6 inline-flex h-12 items-center rounded-full bg-accent px-6 text-sm font-bold text-white shadow-[var(--shadow-lift)] transition hover:-translate-y-0.5"
      >
        Kembali ke dashboard
      </Link>
    </div>
  );
}
