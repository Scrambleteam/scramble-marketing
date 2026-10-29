// Client hub status logic, shared by the admin hub and client workspace.
// Pure functions only — safe to import in client components.

import { SERVICE_META, ServiceKey, TierKey, servicesForTier } from "./tiers";

/** scramble_users columns the admin hub and workspace need */
export const ADMIN_CLIENT_COLUMNS =
  "id, email, company_name, tier, services, created_at, website_domain, site_url, analytics_property_id, ads_customer_id, meta_connected, subscription_status, current_period_end";

export interface AdminClient {
  id: string;
  email: string;
  company_name: string;
  tier: TierKey;
  services: ServiceKey[] | null;
  created_at: string;
  website_domain: string | null;
  site_url: string | null;
  analytics_property_id: string | null;
  ads_customer_id: string | null;
  meta_connected: boolean | null;
  subscription_status: string | null;
  current_period_end: string | null;
}

export interface PropertyOption {
  id: string;
  label: string;
}

/** What the agency Google account can see, per service (from /api/admin/google/accounts) */
export type Listing = { options: PropertyOption[] } | { error: string } | undefined;

export interface AgencyAccounts {
  searchConsole: Listing;
  analytics: Listing;
  ads: Listing;
}

// ─── Billing ────────────────────────────────────────────────────────────────

// Statuses that mean the client has paid (or is on a card-backed trial) and
// belongs in the hub. Payment problems stay in the hub so they get chased.
const CLIENT_STATUSES = ["active", "trialing", "past_due", "unpaid"];

export function isPayingClient(c: Pick<AdminClient, "subscription_status">) {
  return CLIENT_STATUSES.includes(c.subscription_status || "");
}

export function billingLabel(status: string | null): { text: string; tone: "good" | "warn" | "bad" | "muted" } {
  switch (status) {
    case "active":
      return { text: "Active", tone: "good" };
    case "trialing":
      return { text: "Trial", tone: "good" };
    case "past_due":
      return { text: "Payment failed", tone: "bad" };
    case "unpaid":
      return { text: "Unpaid", tone: "bad" };
    case "canceled":
      return { text: "Cancelled", tone: "muted" };
    default:
      return { text: "Checkout not finished", tone: "warn" };
  }
}

export function planLabel(tier: TierKey) {
  return tier === "full" ? "Full Package" : tier === "ads" ? "Google Ads" : "SEO";
}

export function clientServices(c: Pick<AdminClient, "services" | "tier">): ServiceKey[] {
  return c.services?.length ? c.services : servicesForTier(c.tier);
}

// ─── Connection lights ──────────────────────────────────────────────────────

export type LightState =
  | "live" //        assigned, and the agency account can see it
  | "unverified" //  assigned, but we couldn't check (Google not connected / listing failed)
  | "broken" //      assigned, but the agency account can no longer see it
  | "not_assigned" // nothing assigned yet
  | "waiting"; //    Meta: client hasn't connected it

export interface ServiceLight {
  service: ServiceKey;
  label: string;
  state: LightState;
}

const ASSIGNMENT: Partial<Record<ServiceKey, { field: keyof AdminClient; listing: keyof AgencyAccounts }>> = {
  search_console: { field: "site_url", listing: "searchConsole" },
  analytics: { field: "analytics_property_id", listing: "analytics" },
  ads: { field: "ads_customer_id", listing: "ads" },
};

export function serviceLights(c: AdminClient, accounts: AgencyAccounts | null): ServiceLight[] {
  return clientServices(c).map((service) => {
    const label = SERVICE_META[service].label;
    if (service === "meta_ads") {
      return { service, label, state: c.meta_connected ? "live" : "waiting" };
    }
    const map = ASSIGNMENT[service]!;
    const assigned = c[map.field] as string | null;
    if (!assigned) return { service, label, state: "not_assigned" };
    const listing = accounts?.[map.listing];
    if (!listing || "error" in listing) return { service, label, state: "unverified" };
    const visible = listing.options.some((o) => o.id === assigned);
    return { service, label, state: visible ? "live" : "broken" };
  });
}

export const LIGHT_TEXT: Record<LightState, string> = {
  live: "Live",
  unverified: "Assigned (not checked)",
  broken: "Access lost",
  not_assigned: "Not assigned",
  waiting: "Waiting for client",
};

// ─── Next action ────────────────────────────────────────────────────────────

export interface NextAction {
  text: string;
  /** Something Scramble needs to act on (sorted to the top of the hub) */
  attention: boolean;
}

function list(names: string[]) {
  return names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function nextAction(c: AdminClient, lights: ServiceLight[]): NextAction {
  if (c.subscription_status === "past_due" || c.subscription_status === "unpaid") {
    return { text: "Payment failed — check Stripe", attention: true };
  }
  const broken = lights.filter((l) => l.state === "broken").map((l) => l.label);
  if (broken.length) {
    return { text: `${list(broken)} access lost — ask the client to re-add us`, attention: true };
  }
  const unassigned = lights.filter((l) => l.state === "not_assigned").map((l) => l.label);
  if (unassigned.length) {
    return { text: `Assign ${list(unassigned)}`, attention: true };
  }
  if (lights.some((l) => l.state === "waiting")) {
    return { text: "Waiting for the client to connect Meta", attention: false };
  }
  const unverified = lights.filter((l) => l.state === "unverified").map((l) => l.label);
  if (unverified.length) {
    return { text: `Couldn't check ${list(unverified)} access — see the agency Google panel`, attention: false };
  }
  return { text: "All connected", attention: false };
}
