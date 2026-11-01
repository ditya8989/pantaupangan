import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AlertSummary, InvalidLink } from "@/components/alert-summary";
import { ConfirmPanel } from "@/components/token-panels";
import { getAlertByToken } from "@/lib/alerts/service";

export const metadata: Metadata = { title: "Konfirmasi peringatan", robots: { index: false } };

export default function ConfirmPage({ searchParams }: PageProps<"/konfirmasi">) {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold tracking-tight">Konfirmasi peringatan harga</h1>
      <div className="mt-6 space-y-4">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-surface-2/60" aria-hidden="true" />}>
          <ConfirmContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function ConfirmContent({ searchParams }: Pick<PageProps<"/konfirmasi">, "searchParams">) {
  // Data per-token harus selalu segar: render hanya saat request, tidak ikut prerender/prefetch.
  await connection();
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : "";
  const alert = await getAlertByToken(value);
  if (!alert) return <InvalidLink />;
  if (alert.unsubscribed) {
    return (
      <>
        <AlertSummary commodity={alert.commodity} region={alert.region} condition={alert.condition} />
        <p className="text-sm text-fg-2">Peringatan ini sudah dihentikan.</p>
      </>
    );
  }
  return (
    <>
      <AlertSummary commodity={alert.commodity} region={alert.region} condition={alert.condition} />
      <ConfirmPanel token={value} alreadyConfirmed={alert.confirmed} />
    </>
  );
}
