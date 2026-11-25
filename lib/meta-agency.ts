/**
 * Server-only: reads Meta (Facebook / Instagram) Ads data through ONE company
 * system user token, for ad accounts clients have shared with Scramble's Meta
 * business (Business Settings -> Partners). Clients never log in to Meta here.
 *
 * Env:
 *   META_BUSINESS_ID         Scramble's Meta business portfolio ID (also shown to clients)
 *   META_SYSTEM_USER_TOKEN   system user token with ads_read (+ business_management to list accounts)
 *   META_APP_SECRET          optional; adds appsecret_proof when "Require App Secret" is on
 *   META_GRAPH_VERSION       optional, default v26.0
 */

import { createHmac } from "crypto";
import { DAY_MS, cachedAds } from "./ads-cache";
import type { Metric, Period, PropertyOption } from "./google-agency";

const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || "v26.0"}`;

export class MetaError extends Error {
  constructor(public readonly code: "not_configured" | "api_error", message: string) {
    super(message);
    this.name = "MetaError";
  }
}

export function metaBusinessId(): string | null {
  return process.env.META_BUSINESS_ID?.trim() || null;
}

export function metaConfigured(): boolean {
  return !!(process.env.META_SYSTEM_USER_TOKEN?.trim() && metaBusinessId());
}

/** Which Meta settings the running site can't see (names only, never values) */
export function metaMissingSettings(): string[] {
  return [
    ...(metaBusinessId() ? [] : ["META_BUSINESS_ID"]),
    ...(process.env.META_SYSTEM_USER_TOKEN?.trim() ? [] : ["META_SYSTEM_USER_TOKEN"]),
  ];
}

async function graph<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const token = process.env.META_SYSTEM_USER_TOKEN;
  if (!token) throw new MetaError("not_configured", "Meta is not set up yet (META_SYSTEM_USER_TOKEN)");

  const search = new URLSearchParams({ ...params, access_token: token });
  const secret = process.env.META_APP_SECRET;
  if (secret) search.set("appsecret_proof", createHmac("sha256", secret).update(token).digest("hex"));

  const url = path.startsWith("http") ? path : `${GRAPH}${path}?${search.toString()}`;
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const e = body?.error;
    throw new MetaError("api_error", `Meta ${res.status}: ${e?.message || res.statusText}${e?.code ? ` (code ${e.code})` : ""}`);
  }
  return body as T;
}

/** Follows Meta's cursor pagination (full `next` URLs already carry the token) */
async function graphAll<T>(path: string, params: Record<string, string>): Promise<T[]> {
  const out: T[] = [];
  let page = await graph<{ data?: T[]; paging?: { next?: string } }>(path, params);
  for (let i = 0; i < 10; i++) {
    out.push(...(page.data || []));
    if (!page.paging?.next) break;
    page = await graph(page.paging.next);
  }
  return out;
}

/** Ad accounts the business owns or that clients have shared with it */
async function fetchMetaAdAccounts(): Promise<PropertyOption[]> {
  const business = metaBusinessId();
  if (!business) throw new MetaError("not_configured", "Meta is not set up yet (META_BUSINESS_ID)");

  type Acc = { account_id: string; name?: string };
  const fields = { fields: "account_id,name", limit: "100" };
  const [shared, owned] = await Promise.all([
    graphAll<Acc>(`/${business}/client_ad_accounts`, fields),
    graphAll<Acc>(`/${business}/owned_ad_accounts`, fields),
  ]);
  const seen = new Set<string>();
  return [...shared, ...owned]
    .filter((a) => (seen.has(a.account_id) ? false : (seen.add(a.account_id), true)))
    .map((a) => ({ id: a.account_id, label: `${a.name || "Unnamed account"} (${a.account_id})` }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Kept for an hour so the hub and workspaces don't each call Meta */
export function listMetaAdAccounts(): Promise<PropertyOption[]> {
  return cachedAds("meta-accounts", 60 * 60 * 1000, fetchMetaAdAccounts);
}

type ActionRow = { action_type: string; value: string };
type InsightRow = {
  spend?: string;
  inline_link_clicks?: string;
  account_currency?: string;
  actions?: ActionRow[];
  purchase_roas?: ActionRow[];
};

// Actions that count as a result for a business: sales and leads
const CONVERSION_ACTIONS = ["purchase", "omni_purchase", "lead", "omni_complete_registration"];

function sumActions(rows: ActionRow[] | undefined): number {
  const types = new Set(CONVERSION_ACTIONS);
  // Meta reports the same event under several aliases; count the largest alias per family, not the sum of aliases
  const purchases = Math.max(0, ...(rows || []).filter((r) => r.action_type.includes("purchase")).map((r) => Number(r.value) || 0));
  const others = (rows || [])
    .filter((r) => types.has(r.action_type) && !r.action_type.includes("purchase"))
    .reduce((n, r) => n + (Number(r.value) || 0), 0);
  return purchases + others;
}

async function insights(accountId: string, p: Period) {
  const data = await graph<{ data?: InsightRow[] }>(`/act_${accountId}/insights`, {
    fields: "spend,inline_link_clicks,account_currency,actions,purchase_roas",
    time_range: JSON.stringify({ since: p.start, until: p.end }),
    level: "account",
  });
  const r = data.data?.[0];
  return {
    spend: Number(r?.spend ?? 0),
    clicks: Number(r?.inline_link_clicks ?? 0),
    conversions: sumActions(r?.actions),
    roas: Number(r?.purchase_roas?.[0]?.value ?? 0),
    currency: r?.account_currency,
  };
}

async function fetchMetaMetrics(accountId: string, current: Period, previous: Period) {
  const [cur, prev] = await Promise.all([insights(accountId, current), insights(accountId, previous)]);
  const currency = cur.currency || prev.currency || "GBP";
  const metrics: Metric[] = [
    { label: "Spend", current: cur.spend, previous: prev.spend, format: "currency", currency },
    { label: "Link clicks", current: cur.clicks, previous: prev.clicks, format: "number" },
    { label: "Conversions", current: cur.conversions, previous: prev.conversions, format: "number" },
    { label: "ROAS", current: cur.roas, previous: prev.roas, format: "multiplier" },
  ];
  return { period: current, metrics };
}

/** Last 28 days vs the 28 before (ending yesterday). Refreshed once a day. */
export async function metaMetrics(adAccountId: string): Promise<{ period: Period; metrics: Metric[] }> {
  const id = adAccountId.replace(/^act_/, "");
  if (!/^\d+$/.test(id)) throw new MetaError("api_error", "Invalid Meta ad account ID");

  const day = 24 * 60 * 60 * 1000;
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const end = new Date(Date.now() - day);
  const start = new Date(end.getTime() - 27 * day);
  const prevEnd = new Date(start.getTime() - day);
  const prevStart = new Date(prevEnd.getTime() - 27 * day);
  const current = { start: fmt(start), end: fmt(end) };
  const previous = { start: fmt(prevStart), end: fmt(prevEnd) };

  return cachedAds(`meta-metrics:${id}`, DAY_MS, () => fetchMetaMetrics(id, current, previous));
}
