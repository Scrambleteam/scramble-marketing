import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAdminUser, unauthorizedResponse } from "@/lib/api-auth";
import { TEAM_MEMBERS } from "@/lib/workspace";

const UUID_RE = /^[0-9a-f-]{36}$/i;
const STATUSES = ["new", "accepted", "done", "dismissed"];

/**
 * PATCH /api/admin/seo/[suggestionId]
 * Admin only. Body: { status: "new" | "accepted" | "done" | "dismissed", by: "Herbie" | "Gabriel" }
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ suggestionId: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");
  const { suggestionId } = await params;
  if (!UUID_RE.test(suggestionId)) return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!STATUSES.includes(body?.status)) return NextResponse.json({ error: "Unknown status" }, { status: 400 });
  if (!TEAM_MEMBERS.includes(body?.by)) return NextResponse.json({ error: "Choose who you are" }, { status: 400 });

  const now = new Date().toISOString();
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("seo_suggestions")
    .update({ status: body.status, status_by: body.by, status_at: now, updated_at: now })
    .eq("id", suggestionId)
    .select("id, status, status_by, status_at")
    .single();
  if (error || !data) return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  return NextResponse.json({ suggestion: data });
}
