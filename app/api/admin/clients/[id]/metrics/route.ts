import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAdminUser, unauthorizedResponse } from "@/lib/api-auth";
import { getClientMetrics, METRICS_PROFILE_COLUMNS } from "@/lib/client-metrics";

/**
 * GET /api/admin/clients/[id]/metrics
 *
 * Admin only. The same metrics the client sees on their own dashboard.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");

  const { id } = await params;
  try {
    const supabase = createAdminSupabaseClient();
    const { data: profile, error } = await supabase
      .from("scramble_users")
      .select(METRICS_PROFILE_COLUMNS)
      .eq("id", id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(await getClientMetrics(profile));
  } catch (err) {
    console.error("[admin client metrics]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
