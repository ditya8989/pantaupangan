import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { isOnVercel } from "@/lib/env";
import { runFetchJob } from "@/lib/jobs/fetch-prices";
import { PRICES_TAG } from "@/lib/prices/queries";

// Plan Hobby (dengan Fluid compute, bawaan proyek baru) mengizinkan fungsi berjalan sampai 300 detik.
// Job berhenti memulai komoditas baru setelah 3 menit. Sisa waktunya cukup untuk satu permintaan PIHPS
// yang lambat (maks. 2 × 30 detik), menyimpan log, dan mengirim email peringatan. Komoditas yang
// belum terambil diproses paling awal pada run berikutnya (response `done: false`).
export const maxDuration = 300;

function isAuthorized(request: Request, secret: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Dipanggil Vercel Cron setiap hari (lihat vercel.json) dengan header `Authorization: Bearer ${CRON_SECRET}`. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "CRON_SECRET belum diatur." }, { status: 500 });
  }
  if (!isAuthorized(request, secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runFetchJob({ timeBudgetMs: isOnVercel() ? 180_000 : undefined });
  if (result.rowsUpserted > 0) {
    // Data baru: halaman yang memakai tag ini dirender ulang pada kunjungan berikutnya.
    revalidateTag(PRICES_TAG, { expire: 0 });
  }
  return Response.json(result, { status: result.status === "error" ? 502 : 200 });
}
