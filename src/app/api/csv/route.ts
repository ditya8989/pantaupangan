import { sourceLabel } from "@/lib/attribution";
import { addDays } from "@/lib/dates";
import { getLatestDataDate, getPricesForExport } from "@/lib/prices/queries";
import { findCommodityBySlug, findRegionById, findRegionBySlug } from "@/lib/reference";

const ALLOWED_DAYS = new Set([7, 30, 90]);
const MAX_REGIONS = 5;

function csvField(value: string | number): string {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Unduh CSV: /api/csv?komoditas=cabai-rawit-merah&wilayah=nasional,jawa-barat&hari=30 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const commodity = findCommodityBySlug(params.get("komoditas") ?? "");
  if (!commodity) return Response.json({ error: "Parameter komoditas tidak valid." }, { status: 400 });

  const regions = (params.get("wilayah") || "nasional")
    .split(",")
    .slice(0, MAX_REGIONS)
    .map((slug) => findRegionBySlug(slug.trim()))
    .filter((r) => r !== undefined);
  if (regions.length === 0) return Response.json({ error: "Parameter wilayah tidak valid." }, { status: 400 });

  const requestedDays = Number(params.get("hari"));
  const days = ALLOWED_DAYS.has(requestedDays) ? requestedDays : 90;

  const latest = await getLatestDataDate();
  const rows = latest
    ? await getPricesForExport(
        commodity.id,
        regions.map((r) => r.id),
        addDays(latest, -days),
      )
    : [];

  const lines = [
    ["tanggal", "komoditas", "wilayah", "harga_rp", "satuan", "sumber"].join(","),
    ...rows.map((r) =>
      [r.date, commodity.name, findRegionById(r.provinceId)?.name ?? r.provinceId, r.price, commodity.unit, sourceLabel(r.source)]
        .map(csvField)
        .join(","),
    ),
  ];

  // BOM agar Excel membaca UTF-8 dengan benar.
  return new Response(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pantaupangan-${commodity.slug}-${days}hari.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
