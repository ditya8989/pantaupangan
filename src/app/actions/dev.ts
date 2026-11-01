"use server";

import { updateTag } from "next/cache";
import { runFetchJob } from "@/lib/jobs/fetch-prices";
import { PRICES_TAG } from "@/lib/prices/queries";

export type DevFetchState = { ok: boolean; message: string } | null;

/** Hanya untuk development: jalankan job pengambilan data dari tombol di halaman kosong. */
export async function runFetchNowAction(): Promise<DevFetchState> {
  if (process.env.NODE_ENV !== "development" || process.env.VERCEL) {
    return { ok: false, message: "Hanya tersedia di mode development." };
  }
  try {
    const result = await runFetchJob();
    updateTag(PRICES_TAG);
    const failed = result.failed.length > 0 ? ` Gagal: ${result.failed.map((f) => f.commodity).join(", ")}.` : "";
    return {
      ok: result.status !== "error",
      message: `Selesai (${result.source}): ${result.rowsUpserted.toLocaleString("id-ID")} baris disimpan.${failed}`,
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}
