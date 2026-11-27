import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAdminUser, unauthorizedResponse } from "@/lib/api-auth";
import { TEAM_MEMBERS } from "@/lib/workspace";
import { UPDATE_KINDS } from "@/lib/client-updates";

const UUID_RE = /^[0-9a-f-]{36}$/i;
const COLUMNS = "id, kind, body, status, auto_drafted, evidence, created_by, published_by, published_at, created_at";

/** GET /api/admin/clients/[id]/updates: all of the client's updates, drafts included. Admin only. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { data, error } = await createAdminSupabaseClient()
    .from("client_updates")
    .select(COLUMNS)
    .eq("scramble_user_id", id)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) {
    console.error("[admin updates GET]", error);
    return NextResponse.json({ error: "Failed to load updates" }, { status: 500 });
  }
  return NextResponse.json({ updates: data ?? [] });
}

/**
 * POST /api/admin/clients/[id]/updates
 * Admin only. Body: { by, kind: "win" | "done" | "next", body, publish?: boolean }
 * Writes an update by hand. It stays a draft unless publish is true.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const input = await request.json().catch(() => null);
  if (!TEAM_MEMBERS.includes(input?.by)) return NextResponse.json({ error: "Choose who you are" }, { status: 400 });
  if (!(input.kind in UPDATE_KINDS)) return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  const text = typeof input.body === "string" ? input.body.trim() : "";
  if (!text || text.length > 400) return NextResponse.json({ error: "Write between 1 and 400 characters" }, { status: 400 });

  const publish = input.publish === true;
  const now = new Date().toISOString();
  const { data, error } = await createAdminSupabaseClient()
    .from("client_updates")
    .insert({
      scramble_user_id: id,
      kind: input.kind,
      body: text,
      status: publish ? "published" : "draft",
      created_by: input.by,
      published_by: publish ? input.by : null,
      published_at: publish ? now : null,
    })
    .select(COLUMNS)
    .single();
  if (error) {
    console.error("[admin updates POST]", error);
    return NextResponse.json({ error: "Couldn't save" }, { status: 500 });
  }
  return NextResponse.json({ update: data });
}
