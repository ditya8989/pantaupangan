import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DashboardSkeleton, DashboardView } from "@/components/dashboard-view";
import { PageTransition } from "@/components/page-transition";
import { PROVINCES, findRegionBySlug } from "@/lib/reference";

export function generateStaticParams() {
  return PROVINCES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/wilayah/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const region = findRegionBySlug(slug);
  return region ? { title: `Harga bahan pokok di ${region.name}` } : {};
}

export default function ProvincePage({ params }: PageProps<"/wilayah/[slug]">) {
  return (
    <PageTransition>
      <Suspense fallback={<DashboardSkeleton />}>
        <ProvinceDashboard params={params} />
      </Suspense>
    </PageTransition>
  );
}

async function ProvinceDashboard({ params }: Pick<PageProps<"/wilayah/[slug]">, "params">) {
  const { slug } = await params;
  const region = findRegionBySlug(slug);
  if (!region || region.slug === "nasional") notFound();
  return <DashboardView region={region} />;
}
