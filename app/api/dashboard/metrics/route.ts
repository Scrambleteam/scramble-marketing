import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { servicesForTier, ServiceKey, TierKey } from "@/lib/tiers";
import {
  AgencyGoogleError,
  Metric,
  Period,
  adsMetrics,
  analyticsMetrics,
  searchConsoleMetrics,
} from "@/lib/google-agency";

type ServiceResult =
  | { status: "ok"; period: Period; metrics: Metric[] }
  | { status: "not_set_up" }
  | { status: "unavailable" };

async function load(id: string | null, fn: (id: string) => Promise<{ period: Period; metrics: Metric[] }>): Promise<ServiceResult> {
  if (!id) return { status: "not_set_up" };
  try {
    return { status: "ok", ...(await fn(id)) };
  } catch (err) {
    // Details stay in the server log; the client sees a neutral message
    console.error("[dashboard metrics]", err instanceof AgencyGoogleError ? `${err.code}: ${err.message}` : err);
    return { status: "unavailable" };
  }
}

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
      .select("tier, services, site_url, analytics_property_id, ads_customer_id")
      .eq("email", user.email)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const services: ServiceKey[] = profile.services?.length
      ? profile.services
      : servicesForTier(profile.tier as TierKey);

    const [search_console, analytics, ads] = await Promise.all([
      services.includes("search_console") ? load(profile.site_url, searchConsoleMetrics) : null,
      services.includes("analytics") ? load(profile.analytics_property_id, analyticsMetrics) : null,
      services.includes("ads") ? load(profile.ads_customer_id, adsMetrics) : null,
    ]);

    const response = NextResponse.json({ search_console, analytics, ads });
    response.headers.set("Cache-Control", "private, max-age=300");
    return response;
  } catch (err) {
    console.error("[dashboard metrics]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
