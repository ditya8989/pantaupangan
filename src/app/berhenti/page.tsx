import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AlertSummary, InvalidLink } from "@/components/alert-summary";
import { UnsubscribePanel } from "@/components/token-panels";
import { getAlertByToken } from "@/lib/alerts/service";

export const metadata: Metadata = { title: "Berhenti berlangganan", robots: { index: false } };

export default function UnsubscribePage({ searchParams }: PageProps<"/berhenti">) {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold tracking-tight">Berhenti berlangganan</h1>
      <div className="mt-6 space-y-4">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-surface-2/60" aria-hidden="true" />}>
          <UnsubscribeContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function UnsubscribeContent({ searchParams }: Pick<PageProps<"/berhenti">, "searchParams">) {
  // Data per-token harus selalu segar: render hanya saat request, tidak ikut prerender/prefetch.
  await connection();
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : "";
  const alert = await getAlertByToken(value);
  if (!alert) return <InvalidLink />;
  return (
    <>
      <AlertSummary commodity={alert.commodity} region={alert.region} condition={alert.condition} />
      <UnsubscribePanel token={value} alreadyUnsubscribed={alert.unsubscribed} />
    </>
  );
}
