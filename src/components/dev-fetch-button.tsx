"use client";

import { useState, useTransition } from "react";
import { runFetchNowAction, type DevFetchState } from "@/app/actions/dev";

export function DevFetchButton() {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<DevFetchState>(null);

  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setState(await runFetchNowAction());
          })
        }
        className="h-12 rounded-full bg-accent px-6 text-sm font-bold text-white shadow-[var(--shadow-lift)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
      >
        {pending ? "Mengambil data… (bisa ±1 menit)" : "Ambil data 90 hari sekarang"}
      </button>
      <p className="text-xs text-muted">
        Atau jalankan <code className="rounded bg-surface-2 px-1">npm run data:fetch</code> selagi server berjalan.
      </p>
      {state ? (
        <p role="status" className={`text-sm ${state.ok ? "text-down" : "text-up"}`}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
