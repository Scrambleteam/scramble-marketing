import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAdminUser, unauthorizedResponse } from "@/lib/api-auth";
import { TEAM_MEMBERS } from "@/lib/workspace";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f-]{36}$/i;
const COLUMNS =
  "id, title, owner, due_date, scramble_user_id, source, source_id, done, done_at, done_by, created_by, scramble_users(company_name)";

/**
 * PATCH /api/admin/tasks/[taskId]
 * Admin only. Body: { by } plus any of: done (boolean), title, owner (or null), due_date (or null)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");
  const { taskId } = await params;
  if (!UUID_RE.test(taskId)) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!TEAM_MEMBERS.includes(body?.by)) return NextResponse.json({ error: "Choose who you are" }, { status: 400 });

  const now = new Date().toISOString();
  const updates: Record<string, string | boolean | null> = { updated_at: now };
  if ("done" in body) {
    if (typeof body.done !== "boolean") return NextResponse.json({ error: "Invalid done value" }, { status: 400 });
    updates.done = body.done;
    updates.done_at = body.done ? now : null;
    updates.done_by = body.done ? body.by : null;
  }
  if ("title" in body) {
    const t = typeof body.title === "string" ? body.title.trim() : "";
    if (!t || t.length > 200) return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    updates.title = t;
  }
  if ("owner" in body) {
    if (body.owner !== null && !TEAM_MEMBERS.includes(body.owner)) return NextResponse.json({ error: "Unknown owner" }, { status: 400 });
    updates.owner = body.owner;
  }
  if ("due_date" in body) {
    if (body.due_date !== null && !DATE_RE.test(body.due_date)) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    updates.due_date = body.due_date;
  }
  if (Object.keys(updates).length === 1) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { data, error } = await createAdminSupabaseClient()
    .from("team_tasks")
    .update(updates)
    .eq("id", taskId)
    .select(COLUMNS)
    .single();
  if (error || !data) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json({ task: data });
}

/** DELETE /api/admin/tasks/[taskId]: admin only */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");
  const { taskId } = await params;
  if (!UUID_RE.test(taskId)) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  const { error } = await createAdminSupabaseClient().from("team_tasks").delete().eq("id", taskId);
  if (error) return NextResponse.json({ error: "Couldn't delete" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
