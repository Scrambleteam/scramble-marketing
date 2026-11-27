// Shared shapes for client-facing updates (wins, work done, what's next).
// Pure types and labels, safe to import in client components.

export const UPDATE_KINDS = {
  win: "Win",
  done: "What we did",
  next: "What’s next",
} as const;

export type UpdateKind = keyof typeof UPDATE_KINDS;
export type UpdateStatus = "draft" | "published";

/** What the team sees in the admin workspace */
export interface ClientUpdate {
  id: string;
  kind: UpdateKind;
  body: string;
  status: UpdateStatus;
  auto_drafted: boolean;
  evidence: Record<string, number | string>;
  created_by: string | null;
  published_by: string | null;
  published_at: string | null;
  created_at: string;
}

/** What a client sees: published items only, nothing else */
export interface PublicUpdate {
  id: string;
  kind: UpdateKind;
  body: string;
  published_at: string;
}
