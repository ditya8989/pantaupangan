import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type CSSProperties, type ReactNode } from "react";
import { AlertForm } from "@/components/alert-form";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { BellArt, BellIcon, MailIcon, SparkIcon } from "@/components/illustrations";
import { PageTransition } from "@/components/page-transition";
import { alertsEnabled } from "@/lib/env";
import { COMMODITIES, findCommodityBySlug, findRegionBySlug } from "@/lib/reference";

export const metadata: Metadata = {
  title: "Pasang peringatan harga",
  description: "Dapatkan email saat harga bahan pokok di wilayah Anda naik melewati ambang yang Anda tentukan.",
};

const STEPS: { icon: ReactNode; title: string; text: string }[] = [
  { icon: <SparkIcon className="size-5" />, title: "Pilih ambang", text: "Komoditas, wilayah, dan batas harga atau kenaikan persen." },
  { icon: <MailIcon className="size-5" />, title: "Konfirmasi email", text: "Klik tautan di email agar peringatan aktif." },
  { icon: <BellIcon className="size-5" />, title: "Dapat kabar", text: "Kami kirim email saat kondisinya terpenuhi." },
];

export default function AlertPage({ searchParams }: PageProps<"/peringatan">) {
  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 pb-6 pt-5 sm:pt-8">
        <section className="kawung relative overflow-hidden rounded-[2rem] border border-line bg-surface/50 p-6 sm:p-10">
          <HeroBackdrop />
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="grid size-20 shrink-0 place-items-center rounded-[1.6rem] bg-accent-soft shadow-[var(--shadow-card)] sm:size-24">
              <BellArt size={60} className="anim-ring" />
            </span>
            <div>
              <p className="text-sm font-semibold text-accent">Peringatan harga</p>
              <h1 className="mt-0.5 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                Kabari saya saat harga naik
              </h1>
            </div>
          </div>
          <ol className="mt-7 grid gap-3 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="anim-rise flex gap-3 rounded-2xl bg-surface/85 p-4 shadow-sm ring-1 ring-line sm:flex-col"
                style={{ "--i": i + 1 } as CSSProperties}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-white">{step.icon}</span>
                <span>
                  <span className="block text-sm font-bold">
                    {i + 1}. {step.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-fg-2">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {alertsEnabled() ? (
          <div className="anim-rise card mt-6 rounded-[2rem] p-5 sm:p-8" style={{ "--i": 4 } as CSSProperties}>
            <Suspense fallback={<div className="shimmer h-[30rem] rounded-2xl" aria-hidden="true" />}>
              <AlertFormWithDefaults searchParams={searchParams} />
            </Suspense>
          </div>
        ) : (
          // Di Vercel tanpa RESEND_API_KEY: email tidak bisa dikirim, jadi formulir disembunyikan.
          <div
            className="anim-rise card mt-6 rounded-[2rem] p-6 text-center sm:p-10"
            style={{ "--i": 4 } as CSSProperties}
          >
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
              <MailIcon className="size-7" />
            </span>
            <h2 className="mt-4 text-xl font-bold tracking-tight">Peringatan email segera hadir</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-fg-2">
              Pengiriman email sedang disiapkan. Sementara itu, Anda tetap bisa memantau harga terbaru setiap hari.
            </p>
            <Link
              href="/"
              transitionTypes={["nav-back"]}
              className="mt-5 inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-bold text-white shadow-[var(--shadow-lift)] transition hover:-translate-y-0.5"
            >
              Lihat harga terbaru
            </Link>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

async function AlertFormWithDefaults({ searchParams }: Pick<PageProps<"/peringatan">, "searchParams">) {
  const params = await searchParams;
  const commodity = typeof params.komoditas === "string" ? findCommodityBySlug(params.komoditas) : undefined;
  const region = typeof params.wilayah === "string" ? findRegionBySlug(params.wilayah) : undefined;
  return (
    <AlertForm
      initialCommodity={commodity?.slug ?? COMMODITIES[0].slug}
      initialRegion={region?.slug ?? "nasional"}
    />
  );
}
