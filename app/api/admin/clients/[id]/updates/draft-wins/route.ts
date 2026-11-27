import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAdminUser, unauthorizedResponse } from "@/lib/api-auth";
import { TEAM_MEMBERS } from "@/lib/workspace";
import { draftWins, saveWinDrafts } from "@/lib/win-drafts";

const UUID_RE = /^[0-9a-f-]{36}$/i;

/**
 * POST /api/admin/clients/[id]/updates/draft-wins
 * Admin only. Body: { by }. Drafts wins from the client's real data. Nothing is
 * shown to the client; the team edits and publishes what they want.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  const input = await request.json().catch(() => null);
  if (!TEAM_MEMBERS.includes(input?.by)) return NextResponse.json({ error: "Choose who you are" }, { status: 400 });

  const { data: client } = await createAdminSupabaseClient()
    .from("scramble_users")
    .select("site_url, analytics_property_id")
    .eq("id", id)
    .single();
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  if (!client.site_url && !client.analytics_property_id) {
    return NextResponse.json({ error: "Assign a Search Console site or GA4 property on the Connections tab first" }, { status: 400 });
  }

  try {
    const { drafts, skipped } = await draftWins(client);
    const added = await saveWinDrafts(id, drafts, input.by);
    return NextResponse.json({ found: drafts.length, added, skipped });
  } catch (err) {
    console.error("[draft wins]", err);
    return NextResponse.json({ error: "Couldn't draft wins" }, { status: 500 });
  }
}
