import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAdminUser, unauthorizedResponse } from "@/lib/api-auth";
import { cleanSection, SectionKey, TEAM_MEMBERS } from "@/lib/workspace";

const UUID_RE = /^[0-9a-f-]{36}$/i;

/**
 * GET /api/admin/clients/[id]/workspace
 *
 * Admin only. The client's business brief and campaign strategy.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("client_workspace")
    .select("brief, brief_updated_at, brief_updated_by, strategy, strategy_updated_at, strategy_updated_by")
    .eq("scramble_user_id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin workspace GET]", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }

  return NextResponse.json(
    data ?? {
      brief: {},
      brief_updated_at: null,
      brief_updated_by: null,
      strategy: {},
      strategy_updated_at: null,
      strategy_updated_by: null,
    }
  );
}

/**
 * PATCH /api/admin/clients/[id]/workspace
 *
 * Admin only. Saves one section and records it in the activity timeline.
 * Body: { section: "brief" | "strategy", values: {...}, by: "Herbie" | "Gabriel" }
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const section = body?.section as SectionKey;
  if (section !== "brief" && section !== "strategy") {
    return NextResponse.json({ error: "Unknown section" }, { status: 400 });
  }
  if (!TEAM_MEMBERS.includes(body?.by)) {
    return NextResponse.json({ error: "Choose who is saving" }, { status: 400 });
  }
  const cleaned = cleanSection(section, body?.values);
  if ("error" in cleaned) return NextResponse.json({ error: cleaned.error }, { status: 400 });

  const now = new Date().toISOString();
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("client_workspace")
    .upsert(
      {
        scramble_user_id: id,
        [section]: cleaned.values,
        [`${section}_updated_at`]: now,
        [`${section}_updated_by`]: body.by,
      },
      { onConflict: "scramble_user_id" }
    )
    .select("brief, brief_updated_at, brief_updated_by, strategy, strategy_updated_at, strategy_updated_by")
    .single();

  if (error) {
    console.error("[admin workspace PATCH]", error);
    // 23503: no scramble_users row with this id
    if (error.code === "23503") return NextResponse.json({ error: "Client not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  await supabase.from("client_notes").insert({
    scramble_user_id: id,
    type: "system",
    content: section === "brief" ? "Updated the business brief" : "Updated the campaign strategy",
    author: body.by,
  });

  return NextResponse.json(data);
}
