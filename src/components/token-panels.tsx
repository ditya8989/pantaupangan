"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import {
  confirmAlertAction,
  reactivateAction,
  unsubscribeAction,
  type TokenActionState,
} from "@/app/actions/alerts";

const IDLE: TokenActionState = { status: "idle" };

const primaryButton =
  "h-12 rounded-full bg-accent px-7 text-sm font-bold text-white shadow-[var(--shadow-lift)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60";
const secondaryButton =
  "card h-12 rounded-full px-6 text-sm font-bold transition hover:-translate-y-0.5 hover:border-accent/40 disabled:opacity-60";

/** Konfirmasi double opt-in lewat tombol (bukan otomatis), agar pemindai tautan email tidak ikut mengaktifkan. */
export function ConfirmPanel({ token, alreadyConfirmed }: { token: string; alreadyConfirmed: boolean }) {
  const [state, action, pending] = useActionState(confirmAlertAction, IDLE);

  if (alreadyConfirmed || state.result === "confirmed" || state.result === "already") {
    return (
      <div role="status" className="rounded-2xl border border-down/30 bg-down-soft p-4">
        <p className="font-semibold">Peringatan aktif.</p>
        <p className="mt-1 text-sm text-fg-2">
          Kami akan mengirim email saat kondisinya terpenuhi, maksimal sekali sehari dan hanya saat ada data baru.
        </p>
        <Link href="/" className="mt-3 inline-block text-sm font-semibold underline underline-offset-2">
          Kembali ke dashboard
        </Link>
      </div>
    );
  }
  if (state.result === "unsubscribed") {
    return <p className="text-sm text-fg-2">Peringatan ini sudah dihentikan, jadi tidak bisa diaktifkan dari tautan ini.</p>;
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Mengaktifkan…" : "Aktifkan peringatan"}
      </button>
      {state.status === "error" ? <p className="text-sm text-up">Tautan tidak valid atau sudah kedaluwarsa.</p> : null}
    </form>
  );
}

/**
 * Berhenti berlangganan dalam satu klik: formulir dikirim otomatis begitu halaman terbuka di browser
 * (pemindai tautan yang tidak menjalankan JavaScript tidak memicunya), dengan opsi membatalkan.
 */
export function UnsubscribePanel({ token, alreadyUnsubscribed }: { token: string; alreadyUnsubscribed: boolean }) {
  const [state, action, pending] = useActionState(unsubscribeAction, IDLE);
  const [undoState, undoAction, undoPending] = useActionState(reactivateAction, IDLE);
  const formRef = useRef<HTMLFormElement>(null);
  const autoSubmitted = useRef(false);

  useEffect(() => {
    if (alreadyUnsubscribed || autoSubmitted.current) return;
    autoSubmitted.current = true;
    formRef.current?.requestSubmit();
  }, [alreadyUnsubscribed]);

  if (undoState.result === "reactivated") {
    return (
      <div role="status" className="rounded-2xl border border-down/30 bg-down-soft p-4">
        <p className="font-semibold">Peringatan diaktifkan kembali.</p>
      </div>
    );
  }

  const unsubscribed = alreadyUnsubscribed || state.result === "unsubscribed" || state.result === "already";
  if (unsubscribed) {
    return (
      <div role="status" className="space-y-3 rounded-2xl border border-line bg-surface-2/60 p-4">
        <p className="font-semibold">Anda sudah berhenti berlangganan peringatan ini.</p>
        <p className="text-sm text-fg-2">Tidak sengaja? Anda bisa mengaktifkannya lagi.</p>
        <form action={undoAction}>
          <input type="hidden" name="token" value={token} />
          <button type="submit" disabled={undoPending} className={secondaryButton}>
            {undoPending ? "Memproses…" : "Aktifkan lagi"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Memproses…" : "Berhenti berlangganan"}
      </button>
      {state.status === "error" ? <p className="text-sm text-up">Tautan tidak valid.</p> : null}
    </form>
  );
}
