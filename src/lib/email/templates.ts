import { describeCondition, type AlertCondition, type ConditionResult } from "../alerts/conditions";
import { formatDateId } from "../dates";
import { formatPercentDelta, formatRupiah } from "../format";
import type { Commodity, Region } from "../reference";
import type { EmailMessage } from "./index";

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

function layout(title: string, bodyHtml: string, footerHtml: string): string {
  return `<!doctype html>
<html lang="id">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:24px 12px;background:#f6f5f1;font-family:Arial,Helvetica,sans-serif;color:#1c1b17;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e6e3da;border-radius:14px;padding:28px 24px;">
    <p style="margin:0 0 20px;font-size:15px;font-weight:bold;color:#c2410c;">PantauPangan</p>
    ${bodyHtml}
  </div>
  <div style="max-width:520px;margin:16px auto 0;font-size:12px;line-height:1.6;color:#6b675c;text-align:center;">
    ${footerHtml}
  </div>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0;"><a href="${esc(href)}" style="display:inline-block;background:#1c1b17;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:10px;">${esc(label)}</a></p>`;
}

const SOURCE_NOTE = "Sumber data: PIHPS Nasional, Bank Indonesia.";

type AlertContext = {
  commodity: Commodity;
  region: Region;
  condition: AlertCondition;
};

export function confirmationEmail(
  to: string,
  { commodity, region, condition, confirmUrl, cancelUrl }: AlertContext & { confirmUrl: string; cancelUrl: string },
): EmailMessage {
  const what = `${commodity.name} di ${region.name}, saat ${describeCondition(condition)}`;
  const subject = `Konfirmasi peringatan harga ${commodity.name}`;
  const text = [
    "Halo,",
    "",
    "Ada permintaan peringatan harga PantauPangan untuk alamat email ini:",
    what + ".",
    "",
    "Buka tautan ini dan tekan tombol konfirmasi agar peringatan aktif:",
    confirmUrl,
    "",
    "Jika Anda tidak merasa mendaftar, abaikan email ini. Peringatan tidak akan aktif tanpa konfirmasi.",
    `Batalkan permintaan: ${cancelUrl}`,
  ].join("\n");

  const html = layout(
    subject,
    `<h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;">Konfirmasi peringatan harga</h1>
     <p style="margin:0 0 8px;font-size:15px;line-height:1.6;">Ada permintaan peringatan harga untuk alamat email ini:</p>
     <p style="margin:0;font-size:15px;line-height:1.6;"><strong>${esc(what)}</strong>.</p>
     ${button(confirmUrl, "Konfirmasi peringatan")}
     <p style="margin:0;font-size:13px;line-height:1.6;color:#6b675c;">Jika Anda tidak merasa mendaftar, abaikan email ini. Peringatan tidak akan aktif tanpa konfirmasi.</p>`,
    `<a href="${esc(cancelUrl)}" style="color:#6b675c;">Batalkan permintaan ini</a><br>${SOURCE_NOTE}`,
  );

  return { to, subject, html, text };
}

export function priceAlertEmail(
  to: string,
  {
    commodity,
    region,
    condition,
    result,
    detailUrl,
    unsubscribeUrl,
    oneClickUnsubscribeUrl,
  }: AlertContext & {
    result: ConditionResult;
    detailUrl: string;
    unsubscribeUrl: string;
    oneClickUnsubscribeUrl: string;
  },
): EmailMessage {
  const price = formatRupiah(result.latest.price);
  const date = formatDateId(result.latest.date);
  const subject = `${commodity.name} di ${region.name}: ${price}`;
  const changeLine =
    result.changePct !== null && result.reference
      ? `Perubahan 7 hari: ${formatPercentDelta(result.changePct)} (dari ${formatRupiah(result.reference.price)} pada ${formatDateId(result.reference.date)}).`
      : null;

  const text = [
    `Peringatan Anda terpenuhi: ${commodity.name} di ${region.name}, ${describeCondition(condition)}.`,
    "",
    `Harga per ${date}: ${price}/${commodity.unit}.`,
    ...(changeLine ? [changeLine] : []),
    "",
    `Lihat grafik: ${detailUrl}`,
    "",
    SOURCE_NOTE,
    `Berhenti berlangganan peringatan ini: ${unsubscribeUrl}`,
  ].join("\n");

  const html = layout(
    subject,
    `<p style="margin:0 0 6px;font-size:13px;color:#6b675c;">Peringatan Anda terpenuhi: ${esc(describeCondition(condition))}</p>
     <h1 style="margin:0 0 4px;font-size:20px;line-height:1.3;">${esc(commodity.name)} di ${esc(region.name)}</h1>
     <p style="margin:12px 0 0;font-size:30px;font-weight:bold;">${esc(price)}<span style="font-size:15px;font-weight:normal;color:#6b675c;">/${esc(commodity.unit)}</span></p>
     <p style="margin:4px 0 0;font-size:13px;color:#6b675c;">Data per ${esc(date)}</p>
     ${changeLine ? `<p style="margin:16px 0 0;font-size:15px;line-height:1.6;">${esc(changeLine)}</p>` : ""}
     ${button(detailUrl, "Lihat grafik harga")}`,
    `${SOURCE_NOTE}<br><a href="${esc(unsubscribeUrl)}" style="color:#6b675c;">Berhenti berlangganan peringatan ini</a>`,
  );

  return {
    to,
    subject,
    html,
    text,
    headers: {
      "List-Unsubscribe": `<${oneClickUnsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

export function developerFailureEmail(to: string, { errors, logId }: { errors: string; logId: number }): EmailMessage {
  const subject = "PantauPangan: pengambilan data gagal 2 kali berturut-turut";
  const text = `Run #${logId} dan run sebelumnya berstatus error.\n\n${errors}\n\nPeriksa tabel fetch_logs dan endpoint PIHPS.`;
  const html = layout(
    subject,
    `<h1 style="margin:0 0 12px;font-size:18px;">${esc(subject)}</h1><pre style="white-space:pre-wrap;font-size:13px;">${esc(text)}</pre>`,
    "Email otomatis untuk developer.",
  );
  return { to, subject, html, text };
}
