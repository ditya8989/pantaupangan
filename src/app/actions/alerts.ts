"use server";

import { headers } from "next/headers";
import { z } from "zod";
import {
  MAX_ACTIVE_ALERTS_PER_EMAIL,
  confirmAlertByToken,
  createAlert,
  reactivateByToken,
  unsubscribeByToken,
} from "@/lib/alerts/service";
import { alertsEnabled, usesDevOutbox } from "@/lib/env";
import { findCommodityBySlug, findRegionBySlug } from "@/lib/reference";

const FIELDS = ["email", "komoditas", "wilayah", "kondisi", "ambang"] as const;
type Field = (typeof FIELDS)[number];

export type AlertFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<Field, string>>;
  devOutbox?: boolean;
};

const formSchema = z.object({
  email: z.email("Masukkan alamat email yang valid.").max(254, "Alamat email terlalu panjang."),
  komoditas: z.string().refine((v) => Boolean(findCommodityBySlug(v)), "Pilih komoditas."),
  wilayah: z.string().refine((v) => Boolean(findRegionBySlug(v)), "Pilih wilayah."),
  kondisi: z.enum(["above", "pct7d"], "Pilih kondisi peringatan."),
  ambang: z.string().trim().min(1, "Isi ambang peringatan."),
});

/** "Rp80.000" → 80000 (above); "7,5" → 7.5 (pct7d). null jika di luar batas wajar. */
function parseThreshold(kondisi: "above" | "pct7d", raw: string): number | null {
  if (kondisi === "above") {
    const n = Number(raw.replace(/[^\d]/g, ""));
    return Number.isInteger(n) && n >= 100 && n <= 10_000_000 ? n : null;
  }
  const n = Number(raw.replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n >= 0.1 && n <= 500 ? Math.round(n * 10) / 10 : null;
}

export async function createAlertAction(_prev: AlertFormState, formData: FormData): Promise<AlertFormState> {
  if (!alertsEnabled()) {
    return { status: "error", message: "Peringatan email belum aktif di situs ini." };
  }
  // Honeypot: kolom tersembunyi yang hanya diisi bot. Pura-pura berhasil.
  if (String(formData.get("website") ?? "") !== "") {
    return { status: "success", devOutbox: false };
  }

  const raw = Object.fromEntries(FIELDS.map((f) => [f, String(formData.get(f) ?? "")])) as Record<Field, string>;
  const parsed = formSchema.safeParse({ ...raw, email: raw.email.trim().toLowerCase() });
  const fieldErrors: Partial<Record<Field, string>> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as Field;
      fieldErrors[field] ??= issue.message;
    }
  }

  const threshold = parsed.success ? parseThreshold(parsed.data.kondisi, parsed.data.ambang) : null;
  if (parsed.success && threshold === null) {
    fieldErrors.ambang =
      parsed.data.kondisi === "above" ? "Isi harga antara Rp100 dan Rp10.000.000." : "Isi persen antara 0,1 dan 500.";
  }
  if (!parsed.success || threshold === null) {
    return { status: "error", message: "Periksa kembali isian yang ditandai.", fieldErrors };
  }

  const forwardedFor = (await headers()).get("x-forwarded-for") ?? "";
  const ip = forwardedFor.split(",")[0]?.trim() || "lokal";

  try {
    const result = await createAlert({
      email: parsed.data.email,
      commodityId: findCommodityBySlug(parsed.data.komoditas)!.id,
      provinceId: findRegionBySlug(parsed.data.wilayah)!.id,
      condition: { type: parsed.data.kondisi, threshold },
      ip,
    });
    if (!result.ok) {
      return {
        status: "error",
        message:
          result.reason === "rate_limited"
            ? "Terlalu banyak pendaftaran dari jaringan Anda. Coba lagi dalam satu jam."
            : `Email ini sudah punya ${MAX_ACTIVE_ALERTS_PER_EMAIL} peringatan aktif. Hentikan salah satunya lewat tautan di email sebelumnya.`,
      };
    }
  } catch (error) {
    console.error("[alerts] gagal membuat peringatan:", error);
    return { status: "error", message: "Maaf, email konfirmasi gagal dikirim. Coba lagi beberapa saat lagi." };
  }

  return { status: "success", devOutbox: usesDevOutbox() };
}

export type TokenActionState = { status: "idle" | "done" | "error"; result?: string };

export async function confirmAlertAction(_prev: TokenActionState, formData: FormData): Promise<TokenActionState> {
  const result = await confirmAlertByToken(String(formData.get("token") ?? ""));
  return { status: result === "not_found" ? "error" : "done", result };
}

export async function unsubscribeAction(_prev: TokenActionState, formData: FormData): Promise<TokenActionState> {
  const result = await unsubscribeByToken(String(formData.get("token") ?? ""));
  return { status: result === "not_found" ? "error" : "done", result };
}

export async function reactivateAction(_prev: TokenActionState, formData: FormData): Promise<TokenActionState> {
  const result = await reactivateByToken(String(formData.get("token") ?? ""));
  return { status: result === "not_found" ? "error" : "done", result };
}
