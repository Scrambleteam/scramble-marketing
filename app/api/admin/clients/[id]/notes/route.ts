import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAdminUser, unauthorizedResponse } from "@/lib/api-auth";
import { TEAM_MEMBERS } from "@/lib/workspace";

const UUID_RE = /^[0-9a-f-]{36}$/i;
// Team members can add these; 'system' entries are written by the server only
const USER_NOTE_TYPES = ["note", "action", "alert"];

/**
 * GET /api/admin/clients/[id]/notes
 *
 * Admin only. The client's activity timeline, newest first (latest 200).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("client_notes")
    .select("id, created_at, type, content, author")
    .eq("scramble_user_id", id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[admin notes GET]", error);
    return NextResponse.json({ error: "Failed to load activity" }, { status: 500 });
  }
  return NextResponse.json({ notes: data ?? [] });
}

/**
 * POST /api/admin/clients/[id]/notes
 *
 * Admin only. Adds a note to the timeline.
 * Body: { type: "note" | "action" | "alert", content, author: "Herbie" | "Gabriel" }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) return NextResponse.json({ error: "Write something first" }, { status: 400 });
  if (content.length > 5000) return NextResponse.json({ error: "Keep notes under 5000 characters" }, { status: 400 });
  if (!USER_NOTE_TYPES.includes(body?.type)) return NextResponse.json({ error: "Invalid note type" }, { status: 400 });
  if (!TEAM_MEMBERS.includes(body?.author)) return NextResponse.json({ error: "Choose who is writing" }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("client_notes")
    .insert({ scramble_user_id: id, type: body.type, content, author: body.author })
    .select("id, created_at, type, content, author")
    .single();

  if (error) {
    console.error("[admin notes POST]", error);
    if (error.code === "23503") return NextResponse.json({ error: "Client not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }
  return NextResponse.json({ note: data });
}
