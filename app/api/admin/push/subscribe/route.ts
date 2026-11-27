import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAdminUser, unauthorizedResponse } from "@/lib/api-auth";
import { TEAM_MEMBERS } from "@/lib/workspace";

/**
 * POST /api/admin/push/subscribe
 * Admin only. Body: { by: "Herbie" | "Gabriel", subscription: PushSubscriptionJSON }
 * Saves (or re-assigns) this device so it receives that person's notifications.
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");

  const body = await request.json().catch(() => null);
  if (!TEAM_MEMBERS.includes(body?.by)) return NextResponse.json({ error: "Choose who you are" }, { status: 400 });
  const sub = body.subscription;
  if (
    typeof sub?.endpoint !== "string" ||
    !sub.endpoint.startsWith("https://") ||
    sub.endpoint.length > 1000 ||
    typeof sub?.keys?.p256dh !== "string" ||
    typeof sub?.keys?.auth !== "string"
  ) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const { error } = await createAdminSupabaseClient()
    .from("push_subscriptions")
    .upsert(
      {
        member: body.by,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        user_agent: (request.headers.get("user-agent") || "").slice(0, 300),
      },
      { onConflict: "endpoint" }
    );
  if (error) {
    console.error("[push subscribe]", error);
    return NextResponse.json({ error: "Couldn't save notifications" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
