/**
 * Server-only: sends web push notifications to the team's phones.
 *
 * Env (set in Vercel; never commit them):
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY   a key pair (npx web-push generate-vapid-keys)
 *   VAPID_SUBJECT                          optional, default mailto:helloscrambleteam@gmail.com
 */

import { sendNotification, setVapidDetails } from "web-push";
import { createAdminSupabaseClient } from "./supabase";
import { TEAM_MEMBERS } from "./workspace";

export type TeamMemberName = (typeof TEAM_MEMBERS)[number];

export function vapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY?.trim() || null;
}

export function pushConfigured(): boolean {
  return !!(vapidPublicKey() && process.env.VAPID_PRIVATE_KEY?.trim());
}

function configure() {
  setVapidDetails(
    process.env.VAPID_SUBJECT?.trim() || "mailto:helloscrambleteam@gmail.com",
    vapidPublicKey()!,
    process.env.VAPID_PRIVATE_KEY!.trim()
  );
}

export interface PushMessage {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/** Sends to every device the member has subscribed. Returns how many were delivered. */
export async function sendToMember(member: TeamMemberName, message: PushMessage): Promise<{ sent: number; failed: number }> {
  if (!pushConfigured()) throw new Error("Push notifications aren't set up (VAPID keys missing)");
  configure();

  const supabase = createAdminSupabaseClient();
  const { data: subs } = await supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("member", member);

  let sent = 0;
  let failed = 0;
  for (const s of subs ?? []) {
    try {
      await sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(message),
        { TTL: 60 * 60 }
      );
      sent++;
      await supabase.from("push_subscriptions").update({ last_ok_at: new Date().toISOString() }).eq("id", s.id);
    } catch (err) {
      failed++;
      const status = (err as { statusCode?: number }).statusCode;
      // 404 / 410: the device unsubscribed or the app was removed; forget it
      if (status === 404 || status === 410) await supabase.from("push_subscriptions").delete().eq("id", s.id);
      else console.error("[push] send failed", status ?? err);
    }
  }
  return { sent, failed };
}
