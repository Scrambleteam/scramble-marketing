/**
 * Server-only: send transactional email through Resend (https://resend.com).
 *
 * Env:
 *   RESEND_API_KEY  required to send; without it sendEmail() does nothing
 *   EMAIL_FROM      sender, e.g. "Scramble <hello@scramblemarketing.co.uk>"
 *                   (domain must be verified in Resend). Defaults to Resend's
 *                   test sender, which can only deliver to the email address
 *                   the Resend account was created with.
 */

const DEFAULT_FROM = "Scramble <onboarding@resend.dev>";

export interface EmailMessage {
  to: string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

export type SendResult = { sent: true; id: string } | { sent: false; reason: string };

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY is not set" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || DEFAULT_FROM,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { sent: false, reason: `Resend ${res.status}: ${body?.message || res.statusText}` };
    }
    return { sent: true, id: body.id };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : "Unknown error" };
  }
}

/** Escape user-supplied text for inclusion in an HTML email */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
