import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse } from "@/lib/api-auth";
import {
  AgencyGoogleError,
  PropertyOption,
  listAdsAccounts,
  listAnalyticsProperties,
  listSearchConsoleSites,
} from "@/lib/google-agency";

type Listing = { options: PropertyOption[] } | { error: string };

async function settle(fn: () => Promise<PropertyOption[]>): Promise<Listing> {
  try {
    return { options: await fn() };
  } catch (err) {
    console.error("[admin google accounts]", err);
    return { error: err instanceof AgencyGoogleError ? err.message : "Could not load from Google" };
  }
}

/**
 * GET /api/admin/google/accounts
 *
 * Admin only. Lists the Search Console sites, GA4 properties and Google Ads
 * accounts the agency Google account can access, for assigning to clients.
 * Each service is loaded independently so one failure doesn't hide the rest.
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");

  const [searchConsole, analytics, ads] = await Promise.all([
    settle(listSearchConsoleSites),
    settle(listAnalyticsProperties),
    settle(listAdsAccounts),
  ]);

  return NextResponse.json({ searchConsole, analytics, ads });
}
