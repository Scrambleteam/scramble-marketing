import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAdminUser, unauthorizedResponse } from "@/lib/api-auth";
import { CHANGE_COLUMNS, cleanChange } from "@/lib/change-log";
import { TEAM_MEMBERS } from "@/lib/workspace";

const UUID_RE = /^[0-9a-f-]{36}$/i;

/**
 * GET /api/admin/clients/[id]/changes
 * Admin only. The client's campaign changes, newest first.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("campaign_changes")
    .select(CHANGE_COLUMNS)
    .eq("scramble_user_id", id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[admin changes GET]", error);
    return NextResponse.json({ error: "Failed to load changes" }, { status: 500 });
  }
  return NextResponse.json({ changes: data ?? [] });
}

/**
 * POST /api/admin/clients/[id]/changes
 * Admin only. Records a change as proposed.
 * Body: { change_type, summary, campaign_name?, google_customer_id?, before_value?, after_value?, by }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!TEAM_MEMBERS.includes(body?.by)) return NextResponse.json({ error: "Choose who is recording this" }, { status: 400 });
  const cleaned = cleanChange(body);
  if ("error" in cleaned) return NextResponse.json({ error: cleaned.error }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("campaign_changes")
    .insert({ scramble_user_id: id, ...cleaned.values, status: "proposed", proposed_by: body.by })
    .select(CHANGE_COLUMNS)
    .single();

  if (error) {
    console.error("[admin changes POST]", error);
    if (error.code === "23503") return NextResponse.json({ error: "Client not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to save change" }, { status: 500 });
  }
  return NextResponse.json({ change: data });
}
