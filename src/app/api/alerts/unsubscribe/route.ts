import { unsubscribeByToken } from "@/lib/alerts/service";

/**
 * Berhenti berlangganan satu klik dari klien email (RFC 8058):
 * header `List-Unsubscribe-Post: List-Unsubscribe=One-Click` membuat klien mengirim POST ke URL ini.
 */
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const result = await unsubscribeByToken(token);
  if (result === "not_found") return new Response("Tautan tidak valid.", { status: 404 });
  return new Response("Berhasil berhenti berlangganan.", { status: 200 });
}

/** Dibuka di browser: arahkan ke halaman berhenti berlangganan (yang punya opsi membatalkan). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  return Response.redirect(new URL(`/berhenti?token=${encodeURIComponent(token)}`, url.origin), 303);
}
