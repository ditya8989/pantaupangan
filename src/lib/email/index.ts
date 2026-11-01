import { randomBytes } from "node:crypto";
import { Resend } from "resend";
import { emailFrom, isOnVercel } from "../env";
import { pushOutbox } from "./dev-outbox";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
};

export type SendResult = { id: string | null; delivery: "resend" | "dev-outbox" };

let resendClient: Resend | null = null;

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (isOnVercel()) throw new Error("RESEND_API_KEY belum diisi, email tidak dapat dikirim.");
    const id = `dev-${randomBytes(6).toString("hex")}`;
    pushOutbox({ id, ...message, sentAt: new Date().toISOString() });
    console.info(`[email:dev] "${message.subject}" disimpan di kotak keluar dev (/dev/email).`);
    return { id, delivery: "dev-outbox" };
  }

  resendClient ??= new Resend(apiKey);
  const { data, error } = await resendClient.emails.send({
    from: emailFrom(),
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
    headers: message.headers,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
  return { id: data?.id ?? null, delivery: "resend" };
}
