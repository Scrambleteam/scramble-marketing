import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAdminUser, unauthorizedResponse } from "@/lib/api-auth";
import { CHANGE_COLUMNS, ChangeStatus } from "@/lib/change-log";
import { TEAM_MEMBERS } from "@/lib/workspace";

const UUID_RE = /^[0-9a-f-]{36}$/i;

// Each action can only move a change from the status listed here
const TRANSITIONS: Record<string, { from: ChangeStatus; to: ChangeStatus }> = {
  approve: { from: "proposed", to: "approved" },
  reject: { from: "proposed", to: "rejected" },
  applied: { from: "approved", to: "applied" },
};

/**
 * PATCH /api/admin/changes/[changeId]
 * Admin only. Moves a change through its status.
 * Body: { action: "approve" | "reject" | "applied", by: "Herbie" | "Gabriel" }
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ changeId: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");

  const { changeId } = await params;
  if (!UUID_RE.test(changeId)) return NextResponse.json({ error: "Change not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const transition = TRANSITIONS[body?.action];
  if (!transition) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  if (!TEAM_MEMBERS.includes(body?.by)) return NextResponse.json({ error: "Choose who is making this change" }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  const { data: current, error: readError } = await supabase
    .from("campaign_changes")
    .select("status")
    .eq("id", changeId)
    .single();
  if (readError || !current) return NextResponse.json({ error: "Change not found" }, { status: 404 });
  if (current.status !== transition.from) {
    return NextResponse.json({ error: `This change is already ${current.status}` }, { status: 409 });
  }

  const now = new Date().toISOString();
  const update =
    body.action === "approve"
      ? { status: transition.to, approved_by: body.by, approved_at: now }
      : body.action === "applied"
        ? { status: transition.to, applied_by: body.by, applied_at: now }
        : { status: transition.to };

  const { data, error } = await supabase
    .from("campaign_changes")
    .update({ ...update, updated_at: now })
    .eq("id", changeId)
    .eq("status", transition.from)
    .select(CHANGE_COLUMNS)
    .single();

  if (error) {
    console.error("[admin changes PATCH]", error);
    return NextResponse.json({ error: "Failed to update change" }, { status: 500 });
  }
  return NextResponse.json({ change: data });
}
