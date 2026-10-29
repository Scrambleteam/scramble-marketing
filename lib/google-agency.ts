/**
 * Server-only helpers for the agency Google connection.
 *
 * Scramble holds ONE Google connection (the agency account clients add as a
 * user on their Search Console, GA4 and Google Ads). Every call here uses
 * that account's token; which client's data is read is decided by the
 * property IDs an admin assigned on scramble_users — never by the client.
 */

import { createAdminSupabaseClient } from "./supabase";

export const AGENCY_GOOGLE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/webmasters.readonly", // Search Console (read)
  "https://www.googleapis.com/auth/analytics.readonly", // GA4 Admin + Data (read)
  "https://www.googleapis.com/auth/adwords", // Google Ads (read + manage campaigns)
];

/** httpOnly cookie holding the OAuth state between initiate and callback */
export const OAUTH_STATE_COOKIE = "scramble_google_oauth_state";

// Confirm against https://developers.google.com/google-ads/api/docs/sunset-dates
// and override with GOOGLE_ADS_API_VERSION when Google retires this version.
const ADS_API_VERSION = process.env.GOOGLE_ADS_API_VERSION || "v22";

export class AgencyGoogleError extends Error {
  constructor(
    public readonly code: "not_connected" | "reconnect_required" | "not_configured" | "api_error",
    message: string
  ) {
    super(message);
    this.name = "AgencyGoogleError";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Connection + token
// ─────────────────────────────────────────────────────────────────────────────

export interface AgencyConnection {
  google_account_email: string;
  granted_scopes: string;
  connected_by_email: string | null;
  updated_at: string;
}

export async function getAgencyConnection(): Promise<AgencyConnection | null> {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("agency_google_connection")
    .select("google_account_email, granted_scopes, connected_by_email, updated_at")
    .eq("provider", "google")
    .maybeSingle();
  return data;
}

export async function getAgencyAccessToken(): Promise<string> {
  const supabase = createAdminSupabaseClient();
  const { data: row } = await supabase
    .from("agency_google_connection")
    .select("access_token, refresh_token, token_expires_at")
    .eq("provider", "google")
    .maybeSingle();

  if (!row) throw new AgencyGoogleError("not_connected", "The agency Google account is not connected");

  const expiresAt = row.token_expires_at ? new Date(row.token_expires_at).getTime() : 0;
  if (expiresAt - Date.now() > 60_000) return row.access_token;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: row.refresh_token,
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error("[agency google] token refresh failed", res.status, body?.error);
    if (body?.error === "invalid_grant") {
      throw new AgencyGoogleError(
        "reconnect_required",
        "The agency Google connection has expired or was revoked. Reconnect it from the admin page."
      );
    }
    throw new AgencyGoogleError("api_error", `Google token refresh failed (${res.status})`);
  }

  const token = await res.json();
  await supabase
    .from("agency_google_connection")
    .update({
      access_token: token.access_token,
      token_expires_at: new Date(Date.now() + token.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("provider", "google");

  return token.access_token as string;
}

async function googleJson<T>(url: string, init: RequestInit = {}, extraHeaders: Record<string, string> = {}): Promise<T> {
  const token = await getAgencyAccessToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.error?.message || res.statusText;
    throw new AgencyGoogleError("api_error", `Google API ${res.status}: ${message}`);
  }
  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Listing what the agency account can see (admin property picker)
// ─────────────────────────────────────────────────────────────────────────────

export interface PropertyOption {
  id: string;
  label: string;
}

export async function listSearchConsoleSites(): Promise<PropertyOption[]> {
  const data = await googleJson<{ siteEntry?: { siteUrl: string; permissionLevel: string }[] }>(
    "https://www.googleapis.com/webmasters/v3/sites"
  );
  return (data.siteEntry || [])
    .filter((s) => s.permissionLevel !== "siteUnverifiedUser")
    .map((s) => ({ id: s.siteUrl, label: s.siteUrl }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function listAnalyticsProperties(): Promise<PropertyOption[]> {
  const options: PropertyOption[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL("https://analyticsadmin.googleapis.com/v1beta/accountSummaries");
    url.searchParams.set("pageSize", "200");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const data = await googleJson<{
      accountSummaries?: { displayName: string; propertySummaries?: { property: string; displayName: string }[] }[];
      nextPageToken?: string;
    }>(url.toString());
    for (const account of data.accountSummaries || []) {
      for (const p of account.propertySummaries || []) {
        options.push({
          id: p.property.replace(/^properties\//, ""),
          label: `${p.displayName} (${account.displayName})`,
        });
      }
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
  return options.sort((a, b) => a.label.localeCompare(b.label));
}

function adsHeaders(): Record<string, string> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken) {
    throw new AgencyGoogleError("not_configured", "GOOGLE_ADS_DEVELOPER_TOKEN is not set");
  }
  const headers: Record<string, string> = { "developer-token": developerToken };
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "");
  if (loginCustomerId) headers["login-customer-id"] = loginCustomerId;
  return headers;
}

async function adsSearch<T>(customerId: string, query: string): Promise<T[]> {
  const data = await googleJson<{ results?: T[] }>(
    `https://googleads.googleapis.com/${ADS_API_VERSION}/customers/${customerId}/googleAds:search`,
    { method: "POST", body: JSON.stringify({ query }) },
    adsHeaders()
  );
  return data.results || [];
}

export async function listAdsAccounts(): Promise<PropertyOption[]> {
  const managerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "");

  // With a manager (MCC) account: list the client accounts linked under it.
  if (managerId) {
    const rows = await adsSearch<{
      customerClient: { id: string; descriptiveName?: string; manager: boolean };
    }>(
      managerId,
      "SELECT customer_client.id, customer_client.descriptive_name, customer_client.manager FROM customer_client WHERE customer_client.level <= 1"
    );
    return rows
      .filter((r) => !r.customerClient.manager)
      .map((r) => ({
        id: String(r.customerClient.id),
        label: `${r.customerClient.descriptiveName || "Unnamed account"} (${formatAdsId(String(r.customerClient.id))})`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  // Without one: every account the agency user has been added to directly.
  const data = await googleJson<{ resourceNames?: string[] }>(
    `https://googleads.googleapis.com/${ADS_API_VERSION}/customers:listAccessibleCustomers`,
    {},
    adsHeaders()
  );
  return (data.resourceNames || []).map((name) => {
    const id = name.replace(/^customers\//, "");
    return { id, label: formatAdsId(id) };
  });
}

function formatAdsId(id: string) {
  return id.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3");
}

// ─────────────────────────────────────────────────────────────────────────────
// Metrics for the client dashboard (last 28 days vs the 28 days before)
// ─────────────────────────────────────────────────────────────────────────────

export interface Metric {
  label: string;
  current: number;
  previous: number;
  format: "number" | "currency" | "duration" | "position" | "multiplier";
  currency?: string;
  /** For metrics like average position, where going down is good */
  lowerIsBetter?: boolean;
}

export interface Period {
  start: string;
  end: string;
}

function periods(lagDays: number): { current: Period; previous: Period } {
  const day = 24 * 60 * 60 * 1000;
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const end = new Date(Date.now() - lagDays * day);
  const start = new Date(end.getTime() - 27 * day);
  const prevEnd = new Date(start.getTime() - day);
  const prevStart = new Date(prevEnd.getTime() - 27 * day);
  return {
    current: { start: fmt(start), end: fmt(end) },
    previous: { start: fmt(prevStart), end: fmt(prevEnd) },
  };
}

export async function searchConsoleMetrics(siteUrl: string): Promise<{ period: Period; metrics: Metric[] }> {
  // Search Console data is usually 2–3 days behind
  const { current, previous } = periods(3);
  const query = (p: Period) =>
    googleJson<{ rows?: { clicks: number; impressions: number; position: number }[] }>(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      { method: "POST", body: JSON.stringify({ startDate: p.start, endDate: p.end }) }
    ).then((d) => d.rows?.[0] ?? { clicks: 0, impressions: 0, position: 0 });

  const [cur, prev] = await Promise.all([query(current), query(previous)]);
  return {
    period: current,
    metrics: [
      { label: "Impressions", current: cur.impressions, previous: prev.impressions, format: "number" },
      { label: "Clicks", current: cur.clicks, previous: prev.clicks, format: "number" },
      { label: "Avg position", current: cur.position, previous: prev.position, format: "position", lowerIsBetter: true },
    ],
  };
}

export async function analyticsMetrics(propertyId: string): Promise<{ period: Period; metrics: Metric[] }> {
  const { current, previous } = periods(1);
  const data = await googleJson<{
    rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[];
  }>(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: "POST",
    body: JSON.stringify({
      dateRanges: [
        { startDate: current.start, endDate: current.end, name: "current" },
        { startDate: previous.start, endDate: previous.end, name: "previous" },
      ],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "averageSessionDuration" }],
    }),
  });

  // With two date ranges GA4 adds a dateRange dimension to each row
  const byRange = (name: string) =>
    data.rows?.find((r) => r.dimensionValues?.[0]?.value === name)?.metricValues.map((m) => Number(m.value)) ?? [0, 0, 0];
  const cur = byRange("current");
  const prev = byRange("previous");

  return {
    period: current,
    metrics: [
      { label: "Users", current: cur[0], previous: prev[0], format: "number" },
      { label: "Sessions", current: cur[1], previous: prev[1], format: "number" },
      { label: "Avg session", current: cur[2], previous: prev[2], format: "duration" },
    ],
  };
}

export async function adsMetrics(customerId: string): Promise<{ period: Period; metrics: Metric[] }> {
  const { current, previous } = periods(1);
  const id = customerId.replace(/-/g, "");
  if (!/^\d{10}$/.test(id)) throw new AgencyGoogleError("api_error", "Invalid Google Ads customer ID");
  type Row = {
    customer?: { currencyCode?: string };
    metrics?: { costMicros?: string; conversions?: number; conversionsValue?: number };
  };
  const query = (p: Period) =>
    adsSearch<Row>(
      id,
      `SELECT customer.currency_code, metrics.cost_micros, metrics.conversions, metrics.conversions_value FROM customer WHERE segments.date BETWEEN '${p.start}' AND '${p.end}'`
    ).then((rows) => {
      const r = rows[0];
      const cost = Number(r?.metrics?.costMicros ?? 0) / 1_000_000;
      const conversions = Number(r?.metrics?.conversions ?? 0);
      const value = Number(r?.metrics?.conversionsValue ?? 0);
      return { cost, conversions, roas: cost > 0 ? value / cost : 0, currency: r?.customer?.currencyCode };
    });

  const [cur, prev] = await Promise.all([query(current), query(previous)]);
  const currency = cur.currency || prev.currency || "GBP";
  return {
    period: current,
    metrics: [
      { label: "Spend", current: cur.cost, previous: prev.cost, format: "currency", currency },
      { label: "Conversions", current: cur.conversions, previous: prev.conversions, format: "number" },
      { label: "ROAS", current: cur.roas, previous: prev.roas, format: "multiplier" },
    ],
  };
}
