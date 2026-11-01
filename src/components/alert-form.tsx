"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createAlertAction, type AlertFormState } from "@/app/actions/alerts";
import { COMMODITIES, REGIONS } from "@/lib/reference";
import { BellIcon, MailIcon, TrendUpIcon } from "./illustrations";

const INITIAL: AlertFormState = { status: "idle" };

type Props = { initialCommodity: string; initialRegion: string };

const inputClass =
  "h-12 w-full rounded-2xl border-0 bg-surface-2/70 px-4 text-base text-fg ring-1 ring-line transition focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent aria-invalid:ring-2 aria-invalid:ring-up";

export function AlertForm({ initialCommodity, initialRegion }: Props) {
  const [state, formAction, pending] = useActionState(createAlertAction, INITIAL);
  // Input dibuat terkontrol agar isian tetap ada saat validasi gagal.
  const [email, setEmail] = useState("");
  const [commodity, setCommodity] = useState(initialCommodity);
  const [region, setRegion] = useState(initialRegion);
  const [condition, setCondition] = useState<"pct7d" | "above">("pct7d");
  const [threshold, setThreshold] = useState("");

  if (state.status === "success") {
    return (
      <div role="status" className="anim-rise rounded-3xl bg-down-soft p-6 text-center">
        <span className="anim-pop mx-auto grid size-14 place-items-center rounded-full bg-down text-white">
          <MailIcon className="size-7" />
        </span>
        <h2 className="mt-4 text-xl font-extrabold">Cek email Anda</h2>
        <p className="mt-1 text-sm text-fg-2">
          Kami mengirim tautan konfirmasi. Peringatan baru aktif setelah Anda menekan tombol konfirmasi di halaman yang
          ditautkan. Tidak menemukan emailnya? Periksa folder spam.
        </p>
        {state.devOutbox ? (
          <p className="mt-3 text-sm">
            Mode lokal: email tidak benar-benar dikirim.{" "}
            <Link href="/dev/email" className="font-semibold underline underline-offset-2">
              Buka kotak keluar dev
            </Link>
          </p>
        ) : null}
      </div>
    );
  }

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-5">
      <Field label="Email" error={errors.email} htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={inputClass}
          placeholder="nama@contoh.com"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Komoditas" error={errors.komoditas} htmlFor="komoditas">
          <select
            id="komoditas"
            name="komoditas"
            value={commodity}
            onChange={(e) => setCommodity(e.target.value)}
            className={inputClass}
          >
            {COMMODITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Wilayah" error={errors.wilayah} htmlFor="wilayah">
          <select id="wilayah" name="wilayah" value={region} onChange={(e) => setRegion(e.target.value)} className={inputClass}>
            {REGIONS.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-fg-2">Kirim peringatan saat harga…</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(
            [
              ["pct7d", "Naik lebih dari Y% dalam 7 hari"],
              ["above", "Di atas Rp X"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3 rounded-2xl bg-surface-2/60 px-4 py-3.5 text-sm font-medium ring-1 ring-line transition has-checked:bg-accent-soft has-checked:ring-2 has-checked:ring-accent"
            >
              <input
                type="radio"
                name="kondisi"
                value={value}
                checked={condition === value}
                onChange={() => {
                  setCondition(value);
                  setThreshold("");
                }}
                className="size-4 accent-[var(--accent)]"
              />
              <span className="flex-1">{label}</span>
              {value === "pct7d" ? <TrendUpIcon className="size-4 text-accent" /> : <BellIcon className="size-4 text-accent" />}
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        label={condition === "above" ? "Ambang harga (Rp per kg)" : "Ambang kenaikan (%)"}
        error={errors.ambang}
        htmlFor="ambang"
      >
        <div className="relative">
          {condition === "above" ? (
            <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-sm text-muted">Rp</span>
          ) : null}
          <input
            id="ambang"
            name="ambang"
            inputMode={condition === "above" ? "numeric" : "decimal"}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            aria-invalid={Boolean(errors.ambang)}
            aria-describedby={errors.ambang ? "ambang-error" : undefined}
            placeholder={condition === "above" ? "80000" : "10"}
            className={`${inputClass} ${condition === "above" ? "pl-10" : "pr-10"}`}
          />
          {condition === "pct7d" ? (
            <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-sm text-muted">%</span>
          ) : null}
        </div>
      </Field>

      {/* Honeypot anti-bot: tidak terlihat oleh manusia */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Situs web
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      {state.status === "error" && state.message ? (
        <p role="alert" className="rounded-xl bg-up-soft px-3 py-2 text-sm text-up">
          {state.message}
        </p>
      ) : null}

      <div className="space-y-3">
        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full rounded-full bg-accent px-7 text-sm font-bold text-white shadow-[var(--shadow-lift)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60 sm:w-auto"
        >
          {pending ? "Mengirim…" : "Kirim email konfirmasi"}
        </button>
        <p className="text-xs leading-relaxed text-muted">
          Maksimal 1 email per peringatan per hari, hanya saat ada data baru. Email hanya dipakai untuk peringatan ini
          (lihat{" "}
          <Link href="/privasi" className="underline underline-offset-2">
            kebijakan privasi
          </Link>
          ). Setiap email berisi tautan berhenti berlangganan.
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-fg-2">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm text-up">
          {error}
        </p>
      ) : null}
    </div>
  );
}
