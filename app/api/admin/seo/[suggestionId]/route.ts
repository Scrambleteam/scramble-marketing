import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAdminUser, unauthorizedResponse } from "@/lib/api-auth";
import { TEAM_MEMBERS } from "@/lib/workspace";

const UUID_RE = /^[0-9a-f-]{36}$/i;
const STATUSES = ["new", "accepted", "in_progress", "done", "dismissed"];
const RATINGS = ["useful", "not_useful"];

/**
 * PATCH /api/admin/seo/[suggestionId]
 * Admin only. INTERNAL: none of this is ever shown to clients.
 * Body: { by: "Herbie" | "Gabriel" } plus any of:
 *   status: "new" | "accepted" | "in_progress" | "done" | "dismissed"
 *   owner:  "Herbie" | "Gabriel" | null
 *   rating: "useful" | "not_useful" | null
 *   note:   string (internal note, up to 2,000 characters; empty clears it)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ suggestionId: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");
  const { suggestionId } = await params;
  if (!UUID_RE.test(suggestionId)) return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!TEAM_MEMBERS.includes(body?.by)) return NextResponse.json({ error: "Choose who you are" }, { status: 400 });

  const now = new Date().toISOString();
  const updates: Record<string, string | null> = { updated_at: now };

  if ("status" in body) {
    if (!STATUSES.includes(body.status)) return NextResponse.json({ error: "Unknown status" }, { status: 400 });
    updates.status = body.status;
    updates.status_by = body.by;
    updates.status_at = now;
  }
  if ("owner" in body) {
    if (body.owner !== null && !TEAM_MEMBERS.includes(body.owner)) {
      return NextResponse.json({ error: "Unknown owner" }, { status: 400 });
    }
    updates.owner = body.owner;
  }
  if ("rating" in body) {
    if (body.rating !== null && !RATINGS.includes(body.rating)) {
      return NextResponse.json({ error: "Unknown rating" }, { status: 400 });
    }
    updates.rating = body.rating;
    updates.rating_by = body.rating ? body.by : null;
  }
  if ("note" in body) {
    if (typeof body.note !== "string" || body.note.length > 2000) {
      return NextResponse.json({ error: "Note must be text of 2,000 characters or fewer" }, { status: 400 });
    }
    updates.note = body.note.trim() || null;
  }
  if (Object.keys(updates).length === 1) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("seo_suggestions")
    .update(updates)
    .eq("id", suggestionId)
    .select("id, status, status_by, status_at, owner, rating, rating_by, note")
    .single();
  if (error || !data) return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  return NextResponse.json({ suggestion: data });
}
