// Campaign change log: shared types, labels and validation.

export const CHANGE_TYPES = {
  budget: "Budget",
  status: "Pause or enable",
  bid: "Bid",
  keyword: "Keyword",
  ad_copy: "Ad copy",
  other: "Other",
} as const;
export type ChangeType = keyof typeof CHANGE_TYPES;

export const CHANGE_STATUS = {
  proposed: { label: "Proposed", tone: "warn" },
  approved: { label: "Approved", tone: "good" },
  rejected: { label: "Rejected", tone: "muted" },
  applied: { label: "Applied in Google Ads", tone: "plan" },
} as const;
export type ChangeStatus = keyof typeof CHANGE_STATUS;

export interface CampaignChange {
  id: string;
  created_at: string;
  updated_at: string;
  google_customer_id: string | null;
  campaign_name: string | null;
  change_type: ChangeType;
  summary: string;
  before_value: string | null;
  after_value: string | null;
  status: ChangeStatus;
  proposed_by: string;
  approved_by: string | null;
  approved_at: string | null;
  applied_by: string | null;
  applied_at: string | null;
}

export const CHANGE_COLUMNS =
  "id, created_at, updated_at, google_customer_id, campaign_name, change_type, summary, before_value, after_value, status, proposed_by, approved_by, approved_at, applied_by, applied_at";

const MAX = 500;

/** Keep known fields, trimmed and size-limited. */
export function cleanChange(raw: unknown): { values: Record<string, string | null> } | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "Invalid change" };
  const r = raw as Record<string, unknown>;
  const str = (v: unknown, max = MAX) => {
    const s = typeof v === "string" ? v.trim() : "";
    return s.length > max ? "__TOO_LONG__" : s;
  };
  const type = r.change_type;
  if (typeof type !== "string" || !(type in CHANGE_TYPES)) return { error: "Choose what kind of change this is" };
  const summary = str(r.summary);
  if (!summary) return { error: "Describe the change" };
  if (summary === "__TOO_LONG__") return { error: `Keep the description under ${MAX} characters` };
  const values: Record<string, string | null> = { change_type: type, summary };
  for (const key of ["campaign_name", "before_value", "after_value"] as const) {
    const v = str(r[key]);
    if (v === "__TOO_LONG__") return { error: `Keep ${key.replace("_", " ")} under ${MAX} characters` };
    values[key] = v || null;
  }
  const customer = typeof r.google_customer_id === "string" ? r.google_customer_id.replace(/-/g, "").trim() : "";
  if (customer && !/^\d{10}$/.test(customer)) return { error: "Google Ads ID should be 10 digits" };
  values.google_customer_id = customer || null;
  return { values };
}
