import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition, type CSSProperties } from "react";
import { CommodityExplorer } from "@/components/commodity-explorer";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ArrowLeftIcon, CommodityIcon } from "@/components/illustrations";
import { PageTransition } from "@/components/page-transition";
import { ProvinceRanking } from "@/components/province-ranking";
import { getCommodityDetail } from "@/lib/prices/queries";
import { COMMODITIES, findCommodityBySlug } from "@/lib/reference";

export function generateStaticParams() {
  return COMMODITIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/komoditas/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const commodity = findCommodityBySlug(slug);
  if (!commodity) return {};
  return {
    title: `Harga ${commodity.name}`,
    description: `Tren harga ${commodity.name} 7, 30, dan 90 hari terakhir, perbandingan antarprovinsi, dan peringkat provinsi termahal & termurah.`,
  };
}

export default function CommodityPage({ params }: PageProps<"/komoditas/[slug]">) {
  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl px-4 pb-6 pt-5 sm:pt-8">
        <Suspense fallback={<DetailSkeleton />}>
          <CommodityContent params={params} />
        </Suspense>
      </div>
    </PageTransition>
  );
}

async function CommodityContent({ params }: Pick<PageProps<"/komoditas/[slug]">, "params">) {
  const { slug } = await params;
  const commodity = findCommodityBySlug(slug);
  if (!commodity) notFound();
  const detail = await getCommodityDetail(commodity.id);

  return (
    <>
      <section className="kawung relative overflow-hidden rounded-[2rem] border border-line bg-surface/50 p-5 sm:p-8">
        <HeroBackdrop />
        <Link
          href="/"
          transitionTypes={["nav-back"]}
          className="inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1.5 text-sm font-semibold text-fg-2 shadow-sm ring-1 ring-line transition hover:text-accent"
        >
          <ArrowLeftIcon />
          Semua komoditas
        </Link>
        <div className="mt-5 flex items-center gap-4 sm:gap-6">
          <ViewTransition name={`art-${commodity.slug}`} share="morph" default="none">
            <CommodityIcon
              slug={commodity.slug}
              size={92}
              className="anim-float shadow-[var(--shadow-card)]"
              style={{ "--dur": "6s", "--rot": "-4deg" } as CSSProperties}
            />
          </ViewTransition>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-accent">{commodity.category}</p>
            <h1 className="mt-0.5 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{commodity.name}</h1>
            <p className="mt-1 text-sm text-fg-2">Harga konsumen per {commodity.unit} di pasar tradisional</p>
          </div>
        </div>
      </section>

      {detail.latestDate ? (
        <div className="mt-6">
          <CommodityExplorer
            commodity={{ slug: commodity.slug, name: commodity.name, unit: commodity.unit }}
            detail={detail}
          />
          <ProvinceRanking ranking={detail.ranking} date={detail.latestDate} />
        </div>
      ) : (
        <p className="card mt-6 rounded-3xl p-6 text-center text-sm text-fg-2">Belum ada data harga untuk komoditas ini.</p>
      )}
    </>
  );
}

function DetailSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <div className="shimmer h-48 rounded-[2rem]" />
      <div className="shimmer h-44 rounded-3xl" />
      <div className="shimmer h-96 rounded-3xl" />
    </div>
  );
}
