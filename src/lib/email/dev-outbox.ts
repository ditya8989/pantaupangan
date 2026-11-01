/**
 * Kotak keluar untuk development: tanpa RESEND_API_KEY, email disimpan di memori proses
 * dan bisa dilihat di /dev/email (hilang saat server di-restart).
 */

export type OutboxEmail = {
  id: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
  sentAt: string;
};

const MAX_EMAILS = 50;

type GlobalWithOutbox = typeof globalThis & { __pantauPanganOutbox?: OutboxEmail[] };
const globalWithOutbox = globalThis as GlobalWithOutbox;

export function pushOutbox(email: OutboxEmail): void {
  const outbox = (globalWithOutbox.__pantauPanganOutbox ??= []);
  outbox.unshift(email);
  outbox.length = Math.min(outbox.length, MAX_EMAILS);
}

export function listOutbox(): OutboxEmail[] {
  return [...(globalWithOutbox.__pantauPanganOutbox ?? [])];
}
