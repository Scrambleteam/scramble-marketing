import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse } from "@/lib/api-auth";
import { TEAM_MEMBERS } from "@/lib/workspace";
import { pushConfigured, sendToMember } from "@/lib/push";
import { dailyMessage, londonNow, sundayMessage } from "@/lib/reminders";

/**
 * POST /api/admin/push/reminder
 * Admin only. Body: { by, slot: "daily" | "sunday-am" | "sunday-pm" }
 * Sends that reminder to the caller's own devices only, to preview it. Not logged.
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");
  const body = await request.json().catch(() => null);
  if (!TEAM_MEMBERS.includes(body?.by)) return NextResponse.json({ error: "Choose who you are" }, { status: 400 });
  if (!["daily", "sunday-am", "sunday-pm"].includes(body?.slot)) return NextResponse.json({ error: "Unknown reminder" }, { status: 400 });
  if (!pushConfigured()) return NextResponse.json({ error: "Notifications aren't set up on the server yet." }, { status: 503 });

  const message = body.slot === "daily" ? await dailyMessage(body.by, londonNow().date) : sundayMessage(body.slot);
  const result = await sendToMember(body.by, message);
  if (result.sent === 0) return NextResponse.json({ error: "No device is subscribed for you yet." }, { status: 404 });
  return NextResponse.json({ ok: true, ...result });
}
