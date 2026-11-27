import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAdminUser, unauthorizedResponse } from "@/lib/api-auth";
import { TEAM_MEMBERS } from "@/lib/workspace";

const UUID_RE = /^[0-9a-f-]{36}$/i;
const COLUMNS = "id, kind, body, status, auto_drafted, evidence, created_by, published_by, published_at, created_at";

/**
 * PATCH /api/admin/updates/[updateId]
 * Admin only. Body: { by } plus body (edit the wording) and/or status ("published" or "draft").
 * Publishing is what makes a client see it; setting it back to draft hides it again.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ updateId: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");
  const { updateId } = await params;
  if (!UUID_RE.test(updateId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const input = await request.json().catch(() => null);
  if (!TEAM_MEMBERS.includes(input?.by)) return NextResponse.json({ error: "Choose who you are" }, { status: 400 });

  const now = new Date().toISOString();
  const updates: Record<string, string | null> = { updated_at: now };
  if ("body" in input) {
    const text = typeof input.body === "string" ? input.body.trim() : "";
    if (!text || text.length > 400) return NextResponse.json({ error: "Write between 1 and 400 characters" }, { status: 400 });
    updates.body = text;
  }
  if ("status" in input) {
    if (input.status === "published") {
      updates.status = "published";
      updates.published_by = input.by;
      updates.published_at = now;
    } else if (input.status === "draft") {
      updates.status = "draft";
      updates.published_by = null;
      updates.published_at = null;
    } else {
      return NextResponse.json({ error: "Unknown status" }, { status: 400 });
    }
  }
  if (Object.keys(updates).length === 1) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { data, error } = await createAdminSupabaseClient().from("client_updates").update(updates).eq("id", updateId).select(COLUMNS).single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ update: data });
}

/** DELETE /api/admin/updates/[updateId]: admin only */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ updateId: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");
  const { updateId } = await params;
  if (!UUID_RE.test(updateId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { error } = await createAdminSupabaseClient().from("client_updates").delete().eq("id", updateId);
  if (error) return NextResponse.json({ error: "Couldn't delete" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
