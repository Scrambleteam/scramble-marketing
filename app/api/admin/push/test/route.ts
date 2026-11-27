import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse } from "@/lib/api-auth";
import { TEAM_MEMBERS } from "@/lib/workspace";
import { pushConfigured, sendToMember } from "@/lib/push";

/** POST /api/admin/push/test: admin only. Body: { by }. Sends a test notification to that person's devices. */
export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");
  const body = await request.json().catch(() => null);
  if (!TEAM_MEMBERS.includes(body?.by)) return NextResponse.json({ error: "Choose who you are" }, { status: 400 });
  if (!pushConfigured()) return NextResponse.json({ error: "Notifications aren't set up on the server yet." }, { status: 503 });

  try {
    const result = await sendToMember(body.by, { title: "Scramble", body: "Test notification. It works!", tag: "test" });
    if (result.sent === 0) {
      return NextResponse.json({ error: "No device is subscribed for you yet, or delivery failed." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[push test]", err);
    return NextResponse.json({ error: "Couldn't send the test notification." }, { status: 500 });
  }
}
