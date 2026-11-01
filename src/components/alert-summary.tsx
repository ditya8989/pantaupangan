import { describeCondition, type AlertCondition } from "@/lib/alerts/conditions";
import type { Commodity, Region } from "@/lib/reference";

export function AlertSummary({
  commodity,
  region,
  condition,
}: {
  commodity: Commodity;
  region: Region;
  condition: AlertCondition;
}) {
  return (
    <dl className="grid gap-x-4 gap-y-1 rounded-2xl border border-line bg-surface p-4 text-sm sm:grid-cols-[auto_1fr]">
      <dt className="text-muted">Komoditas</dt>
      <dd className="font-semibold">{commodity.name}</dd>
      <dt className="text-muted">Wilayah</dt>
      <dd className="font-semibold">{region.name}</dd>
      <dt className="text-muted">Kondisi</dt>
      <dd className="font-semibold">{describeCondition(condition)}</dd>
    </dl>
  );
}

export function InvalidLink() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 text-sm text-fg-2">
      Tautan ini tidak valid. Pastikan Anda membuka tautan lengkap dari email PantauPangan.
    </div>
  );
}
