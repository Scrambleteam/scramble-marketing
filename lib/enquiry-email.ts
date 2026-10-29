// Server-only: the team notification email for a new /contact enquiry.

import { EnquiryInput } from "./enquiry";
import { EmailMessage, escapeHtml } from "./email";

export const ENQUIRY_NOTIFY_TO = ["helloscrambleteam@gmail.com"];

const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

export function buildEnquiryEmail(enquiry: EnquiryInput, enquiryId: string, receivedAt = new Date()): EmailMessage {
  const when = receivedAt.toLocaleString("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const websiteUrl = enquiry.website
    ? /^https?:\/\//i.test(enquiry.website)
      ? enquiry.website
      : `https://${enquiry.website}`
    : "";

  const subject = `New enquiry: ${oneLine(enquiry.name)}${enquiry.company ? ` (${oneLine(enquiry.company)})` : ""}`;

  const rows: [string, string][] = [
    ["Name", enquiry.name],
    ["Email", enquiry.email],
    ["Company", enquiry.company || "—"],
    ["Website", enquiry.website || "—"],
  ];

  const text = [
    "New enquiry from the Scramble contact form",
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "How can we help?",
    enquiry.message || "—",
    "",
    `Received: ${when}`,
    `Enquiry ID: ${enquiryId}`,
    "",
    `Reply to this email to answer ${enquiry.name} directly.`,
  ].join("\n");

  const cell = "padding:8px 12px;border-bottom:1px solid #e3ecf8;vertical-align:top;";
  const htmlRows = rows
    .map(([k, v]) => {
      let value = escapeHtml(v);
      if (k === "Email") value = `<a href="mailto:${escapeHtml(enquiry.email)}">${value}</a>`;
      if (k === "Website" && websiteUrl) value = `<a href="${escapeHtml(websiteUrl)}">${value}</a>`;
      return `<tr><td style="${cell}color:#5a6b82;width:110px;">${k}</td><td style="${cell}color:#16243a;">${value}</td></tr>`;
    })
    .join("");

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;color:#16243a;">
  <h2 style="font-size:20px;margin:0 0 16px;">New enquiry from the contact form</h2>
  <table style="border-collapse:collapse;width:100%;font-size:15px;">${htmlRows}</table>
  <h3 style="font-size:15px;margin:20px 0 6px;color:#5a6b82;">How can we help?</h3>
  <p style="font-size:15px;line-height:1.55;white-space:pre-wrap;margin:0;">${escapeHtml(enquiry.message || "—")}</p>
  <p style="font-size:13px;color:#8a97ab;margin-top:24px;">Received ${escapeHtml(when)} · Enquiry ID ${escapeHtml(enquiryId)}<br>
  Reply to this email to answer ${escapeHtml(enquiry.name)} directly.</p>
</div>`;

  return { to: ENQUIRY_NOTIFY_TO, subject, text, html, replyTo: enquiry.email };
}
