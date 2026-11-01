import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { listOutbox } from "@/lib/email/dev-outbox";
import { usesDevOutbox } from "@/lib/env";

export const metadata: Metadata = { title: "Kotak keluar dev", robots: { index: false } };

export default function DevEmailPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Kotak keluar (development)</h1>
      <p className="mt-1 text-sm text-fg-2">
        Tanpa <code className="rounded bg-surface-2 px-1">RESEND_API_KEY</code>, email ditampung di memori server lokal
        dan hilang saat server di-restart. Muat ulang halaman untuk melihat email terbaru.
      </p>
      <Suspense fallback={<p className="mt-6 text-sm text-muted">Memuat…</p>}>
        <Outbox />
      </Suspense>
    </div>
  );
}

const URL_PATTERN = /(https?:\/\/[^\s<]+)/g;

function Linkified({ text }: { text: string }) {
  return (
    <>
      {text.split(URL_PATTERN).map((part, i) =>
        i % 2 === 1 ? (
          <a key={i} href={part} className="break-all font-medium text-accent underline underline-offset-2">
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

async function Outbox() {
  await connection();
  if (!usesDevOutbox()) notFound();
  const emails = listOutbox();
  if (emails.length === 0) {
    return <p className="mt-6 rounded-2xl border border-dashed border-fg/20 p-6 text-sm text-fg-2">Belum ada email.</p>;
  }
  return (
    <ul className="mt-6 space-y-4">
      {emails.map((email) => (
        <li key={email.id} className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">
            {new Date(email.sentAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB · kepada {email.to}
          </p>
          <h2 className="mt-1 font-semibold">{email.subject}</h2>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-fg-2">
            <Linkified text={email.text} />
          </pre>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-fg-2">Pratinjau HTML</summary>
            <iframe
              title={`Pratinjau ${email.subject}`}
              srcDoc={email.html}
              sandbox=""
              className="mt-2 h-[28rem] w-full rounded-xl border border-line bg-white"
            />
          </details>
        </li>
      ))}
    </ul>
  );
}
