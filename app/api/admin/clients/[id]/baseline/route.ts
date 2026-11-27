import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAdminUser, unauthorizedResponse } from "@/lib/api-auth";

const UUID_RE = /^[0-9a-f-]{36}$/i;

/**
 * DELETE /api/admin/clients/[id]/baseline
 * Admin only. Restarts the client's baseline: the saved starting numbers are
 * cleared and captured again (from the last 28 days) the next time their
 * dashboard loads.
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { error } = await createAdminSupabaseClient().from("client_baselines").delete().eq("scramble_user_id", id);
  if (error) {
    console.error("[baseline reset]", error);
    return NextResponse.json({ error: "Couldn't restart the baseline" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
