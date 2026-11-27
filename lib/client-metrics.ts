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
  analyticsEnquiries,
  analyticsMetrics,
  searchConsoleMetrics,
  searchConsolePageOneKeywords,
} from "./google-agency";
import { syncBaselines } from "./client-baselines";
import { MetaError, metaMetrics } from "./meta-agency";

export type ServiceResult =
  | { status: "ok"; period: Period; metrics: Metric[] }
  | { status: "not_set_up" }
  | { status: "unavailable" };

/** One of the numbers shown at the top of the client dashboard */
export interface HeadlineMeasure {
  key: "enquiries" | "search_clicks" | "page_one_keywords" | "ad_spend";
  label: string;
  value: number;
  /** The 28 days before */
  previous: number | null;
  /** Value when we started tracking; only set once that was at least a week ago */
  baseline: number | null;
  format: "number" | "currency";
  currency?: string;
  /** A small extra line, e.g. return on ad spend */
  note?: string;
  /** False for spend: spending more is not automatically better */
  trend: boolean;
}

export interface Headline {
  measures: HeadlineMeasure[];
  /** ISO date we started tracking this client (the oldest baseline), if any */
  trackingSince: string | null;
}

export interface ClientMetrics {
  search_console: ServiceResult | null;
  analytics: ServiceResult | null;
  ads: ServiceResult | null;
  meta_ads: ServiceResult | null;
  headline: Headline | null;
}

export interface MetricsProfile {
  id: string;
  tier: string;
  services: ServiceKey[] | null;
  site_url: string | null;
  analytics_property_id: string | null;
  ads_customer_id: string | null;
  meta_ad_account_id: string | null;
}

/** Columns to select from scramble_users for getClientMetrics */
export const METRICS_PROFILE_COLUMNS = "id, tier, services, site_url, analytics_property_id, ads_customer_id, meta_ad_account_id";

async function load(
  id: string | null,
  fn: (id: string) => Promise<{ period: Period; metrics: Metric[] }>
): Promise<ServiceResult> {
  if (!id) return { status: "not_set_up" };
  try {
    return { status: "ok", ...(await fn(id)) };
  } catch (err) {
    // Details stay in the server log; callers see a neutral status
    console.error("[client metrics]", err instanceof AgencyGoogleError || err instanceof MetaError ? `${err.code}: ${err.message}` : err);
    return { status: "unavailable" };
  }
}

const BASELINE_MIN_AGE_MS = 7 * 24 * 60 * 60 * 1000;

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    console.error("[client headline]", err instanceof AgencyGoogleError ? `${err.code}: ${err.message}` : err);
    return null;
  }
}

const metric = (r: ServiceResult | null, label: string) =>
  r?.status === "ok" ? r.metrics.find((m) => m.label === label) : undefined;

async function buildHeadline(
  profile: MetricsProfile,
  services: ServiceKey[],
  results: Pick<ClientMetrics, "search_console" | "ads" | "meta_ads">
): Promise<Headline | null> {
  const [enq, pageOne] = await Promise.all([
    services.includes("analytics") && profile.analytics_property_id ? safe(() => analyticsEnquiries(profile.analytics_property_id!)) : null,
    services.includes("search_console") && profile.site_url ? safe(() => searchConsolePageOneKeywords(profile.site_url!)) : null,
  ]);

  const drafts: (Omit<HeadlineMeasure, "baseline"> & { period: Period })[] = [];
  if (enq) drafts.push({ key: "enquiries", label: "Enquiries", value: enq.current, previous: enq.previous, format: "number", trend: true, period: enq.period, note: "From organic search" });

  const clicks = metric(results.search_console, "Clicks");
  if (clicks && results.search_console?.status === "ok") {
    drafts.push({ key: "search_clicks", label: "Search clicks", value: clicks.current, previous: clicks.previous, format: "number", trend: true, period: results.search_console.period });
  }
  if (pageOne) drafts.push({ key: "page_one_keywords", label: "Page one keywords", value: pageOne.current, previous: pageOne.previous, format: "number", trend: true, period: pageOne.period });

  const adSources = [results.ads, results.meta_ads].filter((r): r is Extract<ServiceResult, { status: "ok" }> => r?.status === "ok");
  if (adSources.length) {
    const spends = adSources.map((r) => r.metrics.find((m) => m.label === "Spend"));
    const roas = adSources.map((r) => r.metrics.find((m) => m.label === "ROAS"));
    const spend = spends.reduce((n, m) => n + (m?.current ?? 0), 0);
    const previousSpend = spends.reduce((n, m) => n + (m?.previous ?? 0), 0);
    const weighted = spend > 0 ? spends.reduce((n, m, i) => n + (m?.current ?? 0) * (roas[i]?.current ?? 0), 0) / spend : 0;
    drafts.push({
      key: "ad_spend",
      label: "Ad spend",
      value: spend,
      previous: previousSpend,
      format: "currency",
      currency: spends.find((m) => m?.currency)?.currency ?? "GBP",
      note: weighted > 0 ? `ROAS ${weighted.toFixed(1)}x` : undefined,
      trend: false,
      period: adSources[0].period,
    });
  }
  if (drafts.length === 0) return null;

  const baselines = await syncBaselines(profile.id, drafts.map((d) => ({ key: d.key, value: d.value, period: d.period })));
  const now = Date.now();
  const measures: HeadlineMeasure[] = drafts.map(({ period, ...d }) => {
    void period;
    const b = baselines[d.key];
    const old = b && now - new Date(b.capturedAt).getTime() >= BASELINE_MIN_AGE_MS;
    return { ...d, baseline: old ? b.value : null };
  });
  const since = Object.values(baselines).map((b) => b.capturedAt).sort()[0] ?? null;
  return { measures, trackingSince: since };
}

export async function getClientMetrics(profile: MetricsProfile): Promise<ClientMetrics> {
  const services: ServiceKey[] = profile.services?.length
    ? profile.services
    : servicesForTier(profile.tier as TierKey);

  const [search_console, analytics, ads, meta_ads] = await Promise.all([
    services.includes("search_console") ? load(profile.site_url, searchConsoleMetrics) : null,
    services.includes("analytics") ? load(profile.analytics_property_id, analyticsMetrics) : null,
    services.includes("ads") ? load(profile.ads_customer_id, adsMetrics) : null,
    services.includes("meta_ads") ? load(profile.meta_ad_account_id, metaMetrics) : null,
  ]);

  const headline = await buildHeadline(profile, services, { search_console, ads, meta_ads });
  return { search_console, analytics, ads, meta_ads, headline };
}
