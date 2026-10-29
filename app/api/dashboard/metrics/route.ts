import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { getClientMetrics, METRICS_PROFILE_COLUMNS } from "@/lib/client-metrics";

/**
 * GET /api/dashboard/metrics
 *
 * Returns the signed-in client's Google metrics for the last 28 days vs the
 * 28 days before. Data is read through the agency Google connection, using
 * only the properties an admin assigned to this client's profile.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user?.email) return unauthorizedResponse();

  try {
    const supabase = createAdminSupabaseClient();
    const { data: profile, error } = await supabase
      .from("scramble_users")
      .select(METRICS_PROFILE_COLUMNS)
      .eq("email", user.email)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const response = NextResponse.json(await getClientMetrics(profile));
    response.headers.set("Cache-Control", "private, max-age=300");
    return response;
  } catch (err) {
    console.error("[dashboard metrics]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
