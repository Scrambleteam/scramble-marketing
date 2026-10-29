/**
 * Server-only: builds one client's dashboard metrics from the agency Google
 * connection. Shared by the client dashboard and the admin client workspace
 * so both always show exactly the same numbers.
 */

import { servicesForTier, ServiceKey, TierKey } from "./tiers";
import {
  AgencyGoogleError,
  Metric,
  Period,
  adsMetrics,
  analyticsMetrics,
  searchConsoleMetrics,
} from "./google-agency";

export type ServiceResult =
  | { status: "ok"; period: Period; metrics: Metric[] }
  | { status: "not_set_up" }
  | { status: "unavailable" };

export interface ClientMetrics {
  search_console: ServiceResult | null;
  analytics: ServiceResult | null;
  ads: ServiceResult | null;
}

export interface MetricsProfile {
  tier: string;
  services: ServiceKey[] | null;
  site_url: string | null;
  analytics_property_id: string | null;
  ads_customer_id: string | null;
}

/** Columns to select from scramble_users for getClientMetrics */
export const METRICS_PROFILE_COLUMNS = "tier, services, site_url, analytics_property_id, ads_customer_id";

async function load(
  id: string | null,
  fn: (id: string) => Promise<{ period: Period; metrics: Metric[] }>
): Promise<ServiceResult> {
  if (!id) return { status: "not_set_up" };
  try {
    return { status: "ok", ...(await fn(id)) };
  } catch (err) {
    // Details stay in the server log; callers see a neutral status
    console.error("[client metrics]", err instanceof AgencyGoogleError ? `${err.code}: ${err.message}` : err);
    return { status: "unavailable" };
  }
}

export async function getClientMetrics(profile: MetricsProfile): Promise<ClientMetrics> {
  const services: ServiceKey[] = profile.services?.length
    ? profile.services
    : servicesForTier(profile.tier as TierKey);

  const [search_console, analytics, ads] = await Promise.all([
    services.includes("search_console") ? load(profile.site_url, searchConsoleMetrics) : null,
    services.includes("analytics") ? load(profile.analytics_property_id, analyticsMetrics) : null,
    services.includes("ads") ? load(profile.ads_customer_id, adsMetrics) : null,
  ]);

  return { search_console, analytics, ads };
}
