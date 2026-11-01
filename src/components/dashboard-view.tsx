import { ViewTransition, type CSSProperties } from "react";
import { SOURCE_NAME, SOURCE_URL } from "@/lib/attribution";
import { formatDateId } from "@/lib/dates";
import { getRegionDashboard } from "@/lib/prices/queries";
import { COMMODITIES, NATIONAL_ID, type Region } from "@/lib/reference";
import { DevFetchButton } from "./dev-fetch-button";
import { HeroBackdrop, LiveDot, Squiggle } from "./hero-backdrop";
import { Highlights } from "./highlights";
import { CommodityIcon } from "./illustrations";
import { MoversTicker } from "./movers-ticker";
import { PriceCard } from "./price-card";
import { RegionSelect } from "./region-select";

/** Ilustrasi yang melayang di hero. `mobile` = versi kecil yang tetap tampil di layar sempit. */
const FLOATING_ART = [
  { slug: "cabai-rawit-merah", size: 92, place: "sm:right-[6%] sm:top-[12%]", rot: "-10deg", dur: "6s", delay: "0s", mobile: { size: 50, place: "right-3 top-3" } },
  { slug: "telur-ayam-ras", size: 70, place: "sm:right-[27%] sm:top-[6%]", rot: "8deg", dur: "7s", delay: "-2s", mobile: { size: 42, place: "right-[4.4rem] top-4" } },
  { slug: "beras-super-1", size: 100, place: "sm:right-[19%] sm:bottom-[12%]", rot: "-4deg", dur: "8s", delay: "-1s", mobile: null },
  { slug: "bawang-merah", size: 64, place: "sm:right-[3%] sm:bottom-[22%]", rot: "12deg", dur: "6.5s", delay: "-3s", mobile: null },
  { slug: "minyak-goreng-kemasan", size: 60, place: "sm:right-[37%] sm:bottom-[16%]", rot: "-8deg", dur: "7.5s", delay: "-4s", mobile: null },
] as const;

export async function DashboardView({ region }: { region: Region }) {
  const data = await getRegionDashboard(region.id);
  const isNational = region.id === NATIONAL_ID;

  const entries = COMMODITIES.map((commodity) => ({
    commodity,
    item: data.items.find((i) => i.commodityId === commodity.id),
  }));
  const tickerItems = entries
    .filter(({ item }) => item?.changes)
    .map(({ commodity, item }) => ({
      slug: commodity.slug,
      name: commodity.name,
      price: item!.changes!.latest.price,
      delta: item!.changes!.vsWeek,
    }));
  const highlightEntries = entries
    .filter(({ item }) => item?.changes)
    .map(({ commodity, item }) => ({ commodity, changes: item!.changes! }));

  return (
    <ViewTransition key={region.slug} name="dashboard" share="auto" enter="auto" default="none">
      <div className="mx-auto max-w-6xl space-y-8 px-4 pb-6 pt-5 sm:pt-8">
        {/* Hero */}
        <section className="kawung relative overflow-hidden rounded-[2rem] border border-line bg-surface/50 px-5 pb-7 pt-5 sm:px-10 sm:pb-12 sm:pt-10">
          <HeroBackdrop />
          <div aria-hidden="true">
            {FLOATING_ART.map((art) => {
              const motion = { "--rot": art.rot, "--dur": art.dur, "--delay": art.delay } as CSSProperties;
              return (
                <span key={art.slug}>
                  <span className={`anim-float absolute hidden sm:block ${art.place}`} style={motion}>
                    <CommodityIcon slug={art.slug} size={art.size} className="shadow-[var(--shadow-card)]" />
                  </span>
                  {art.mobile ? (
                    <span className={`anim-float absolute sm:hidden ${art.mobile.place}`} style={motion}>
                      <CommodityIcon slug={art.slug} size={art.mobile.size} className="shadow-[var(--shadow-card)]" />
                    </span>
                  ) : null}
                </span>
              );
            })}
          </div>

          <div className="relative max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-surface/90 px-3 py-1.5 text-xs font-semibold text-fg-2 shadow-sm ring-1 ring-line">
              <LiveDot />
              {data.latestDate ? <>Data per {formatDateId(data.latestDate)}</> : "Menunggu data pertama"}
            </p>
            <h1 className="mt-5 text-[2.35rem] font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
              Harga pangan
              <br />
              <span className="relative inline-block text-accent">
                {isNational ? "se-Indonesia" : `di ${region.name}`}
                <Squiggle />
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-fg-2 sm:text-lg">
              Pantau harga beras, cabai, bawang, sampai telur dari pasar tradisional, lengkap dengan tren dan
              perbandingan antarprovinsi. Data dari{" "}
              <a href={SOURCE_URL} className="font-semibold text-fg underline underline-offset-2 hover:text-accent" rel="noopener">
                {SOURCE_NAME}
              </a>
              , diperbarui setiap hari kerja.
            </p>
            <div className="mt-6">
              <RegionSelect current={region.slug} />
            </div>
          </div>
        </section>

        {data.source === "mock" ? (
          <p className="rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-fg">
            <strong>Mode demo:</strong> ini data contoh (DATA_SOURCE=mock), bukan harga sebenarnya.
          </p>
        ) : null}

        {data.latestDate ? (
          <>
            <MoversTicker items={tickerItems} regionSlug={region.slug} />
            <Highlights entries={highlightEntries} regionSlug={region.slug} />

            <section aria-labelledby="semua-komoditas">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 id="semua-komoditas" className="text-2xl font-extrabold tracking-tight">
                    Semua komoditas
                  </h2>
                  <p className="text-sm text-fg-2">
                    {isNational ? "Rata-rata nasional" : region.name} · harga konsumen di pasar tradisional
                  </p>
                </div>
                <p className="text-sm text-muted">Ketuk kartu untuk grafik lengkap</p>
              </div>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {entries.map(({ commodity, item }, index) => (
                  <PriceCard
                    key={commodity.id}
                    commodity={commodity}
                    changes={item?.changes ?? null}
                    spark={item?.spark ?? []}
                    regionSlug={region.slug}
                    regionLatestDate={data.latestDate}
                    index={index}
                  />
                ))}
              </ul>
            </section>
          </>
        ) : (
          <EmptyState />
        )}

        <p className="max-w-3xl text-xs leading-relaxed text-muted">
          Perubahan dibandingkan dengan hari data sebelumnya dan dengan harga sekitar 7 hari sebelumnya. PIHPS tidak
          mencatat harga pada akhir pekan dan hari libur. &ldquo;Stabil&rdquo; berarti perubahan kurang dari 0,5%.
        </p>
      </div>
    </ViewTransition>
  );
}

function EmptyState() {
  const isDev = process.env.NODE_ENV === "development";
  return (
    <div className="card rounded-[2rem] px-6 py-12 text-center">
      <div className="flex justify-center -space-x-3" aria-hidden="true">
        {["beras-super-1", "cabai-rawit-merah", "telur-ayam-ras", "bawang-merah"].map((slug, i) => (
          <CommodityIcon
            key={slug}
            slug={slug}
            size={56}
            className="anim-float ring-4 ring-surface"
            style={{ "--delay": `${-i * 1.2}s`, "--dur": "5s" } as CSSProperties}
          />
        ))}
      </div>
      <h2 className="mt-5 text-xl font-bold">Belum ada data harga</h2>
      {isDev ? (
        <>
          <p className="mx-auto mt-1 max-w-md text-sm text-fg-2">
            Database lokal masih kosong. Ambil data 90 hari terakhir dari sumber yang diatur di{" "}
            <code className="rounded bg-surface-2 px-1">DATA_SOURCE</code>.
          </p>
          <DevFetchButton />
        </>
      ) : (
        <p className="mx-auto mt-1 max-w-md text-sm text-fg-2">
          Data akan muncul setelah pengambilan data terjadwal berjalan.
        </p>
      )}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pb-6 pt-5 sm:pt-8" aria-hidden="true">
      <div className="shimmer h-80 rounded-[2rem]" />
      <div className="shimmer h-12 rounded-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COMMODITIES.map((c) => (
          <div key={c.id} className="shimmer h-56 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
