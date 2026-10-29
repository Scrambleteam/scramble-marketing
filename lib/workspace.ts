// Client workspace sections (brief, strategy) and activity notes.
// Shared by the admin API (validation) and the workspace forms (rendering).

export interface WorkspaceField {
  key: string;
  label: string;
  hint?: string;
  kind: "text" | "money";
}

export const BRIEF_FIELDS: WorkspaceField[] = [
  { key: "description", label: "What the business does", kind: "text" },
  { key: "targetAudience", label: "Ideal customer", kind: "text" },
  { key: "businessGoals", label: "Goals", hint: "What success looks like, e.g. more calls, online sales", kind: "text" },
  { key: "serviceArea", label: "Service area", hint: "e.g. South Birmingham, 8 miles from B15", kind: "text" },
  { key: "keyServices", label: "Services or products to prioritise", kind: "text" },
  { key: "competitors", label: "Competitors", kind: "text" },
  { key: "existingAssets", label: "Existing assets", hint: "Website, Google Business Profile, social accounts, shop", kind: "text" },
  { key: "seoRetainerFee", label: "Monthly SEO retainer (£)", kind: "money" },
  { key: "adsBudget", label: "Monthly ad budget (£)", hint: "Spend on ads, separate from Scramble's fee", kind: "money" },
  { key: "additionalNotes", label: "Anything else", kind: "text" },
];

export const STRATEGY_FIELDS: WorkspaceField[] = [
  { key: "summary", label: "Summary", hint: "What we're doing and why, in plain English", kind: "text" },
  { key: "targetKeywords", label: "Target keywords", kind: "text" },
  { key: "adCampaignStructure", label: "Ad campaign structure", hint: "Campaigns, ad groups, budget split", kind: "text" },
  { key: "nextActions", label: "Next actions", hint: "What we plan to do in the next 7 days", kind: "text" },
];

export type SectionKey = "brief" | "strategy";
export const SECTION_FIELDS: Record<SectionKey, WorkspaceField[]> = {
  brief: BRIEF_FIELDS,
  strategy: STRATEGY_FIELDS,
};

export type SectionValues = Record<string, string | number | null>;

const MAX_TEXT = 5000;

/** Keep only known fields, trimmed and size-limited. Returns an error message if invalid. */
export function cleanSection(section: SectionKey, raw: unknown): { values: SectionValues } | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "Invalid data" };
  const input = raw as Record<string, unknown>;
  const values: SectionValues = {};
  for (const f of SECTION_FIELDS[section]) {
    const v = input[f.key];
    if (f.kind === "money") {
      if (v === null || v === undefined || v === "") values[f.key] = null;
      else {
        const n = Number(v);
        if (!Number.isFinite(n) || n < 0 || n > 10_000_000) return { error: `${f.label}: enter a valid amount` };
        values[f.key] = Math.round(n * 100) / 100;
      }
    } else {
      const s = typeof v === "string" ? v.trim() : "";
      if (s.length > MAX_TEXT) return { error: `${f.label}: keep it under ${MAX_TEXT} characters` };
      values[f.key] = s;
    }
  }
  return { values };
}

export function sectionIsEmpty(section: SectionKey, values: SectionValues | null | undefined) {
  if (!values) return true;
  return SECTION_FIELDS[section].every((f) => values[f.key] === null || values[f.key] === undefined || values[f.key] === "");
}

// ─── Activity ───────────────────────────────────────────────────────────────

// Gabriel and Herbie share one admin login, so the author is picked in the
// form rather than taken from the session.
export const TEAM_MEMBERS = ["Herbie", "Gabriel"] as const;

export const NOTE_TYPES = {
  note: "Note",
  action: "Action taken",
  alert: "Alert",
  system: "Automatic",
} as const;

export type NoteType = keyof typeof NOTE_TYPES;

export interface ClientNote {
  id: string;
  created_at: string;
  type: NoteType;
  content: string;
  author: string;
}
