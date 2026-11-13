// SEO opportunity rules. Pure functions over Search Console / Analytics rows:
// no network calls, so they are easy to test. Thresholds are starting points;
// change them here as we learn what is useful.

export type SeoKind = "near_page_one" | "low_ctr" | "declining" | "low_engagement";

export const SEO_KINDS: Record<SeoKind, { label: string; help: string }> = {
  near_page_one: { label: "Close to page one", help: "Ranking just off the first page, where a small improvement can bring real traffic." },
  low_ctr: { label: "Low click-through", help: "Ranking well but few people click, which usually means a weak title or description." },
  declining: { label: "Losing traffic", help: "Clicks have dropped sharply compared with the previous 28 days." },
  low_engagement: { label: "Low engagement", help: "Pages that get visits but where few visitors engage." },
};

export const THRESHOLDS = {
  nearPageOne: { minPosition: 8, maxPosition: 20, minImpressions: 50, limit: 15 },
  lowCtr: { maxPosition: 10, minImpressions: 100, belowBenchmark: 0.5, limit: 15 },
  declining: { minPreviousClicks: 20, dropRatio: 0.6, limit: 15 },
  lowEngagement: { minSessions: 50, maxEngagementRate: 0.4, limit: 10 },
};

export interface QueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number; // 0 to 1
  position: number;
}

export interface PageEngagement {
  page: string;
  sessions: number;
  engagementRate: number; // 0 to 1
}

export interface SeoSuggestionDraft {
  kind: SeoKind;
  dedupe_key: string;
  subject: string;
  summary: string;
  recommendation: string;
  evidence: Record<string, number | string>;
}

/** Rough share of clicks by position on Google results; used to spot weak titles. */
export function expectedCtr(position: number): number {
  const p = Math.round(position);
  if (p <= 1) return 0.28;
  if (p === 2) return 0.15;
  if (p === 3) return 0.1;
  if (p === 4) return 0.07;
  if (p === 5) return 0.05;
  return 0.03;
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const pos = (n: number) => n.toFixed(1);

export function analyseSearch(current: QueryRow[], previous: QueryRow[]): SeoSuggestionDraft[] {
  const out: SeoSuggestionDraft[] = [];
  const t = THRESHOLDS;

  const near = current
    .filter((r) => r.position >= t.nearPageOne.minPosition && r.position <= t.nearPageOne.maxPosition && r.impressions >= t.nearPageOne.minImpressions)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, t.nearPageOne.limit);
  for (const r of near) {
    out.push({
      kind: "near_page_one",
      dedupe_key: `near_page_one:${r.query}`,
      subject: r.query,
      summary: `“${r.query}” ranks at position ${pos(r.position)} with ${r.impressions} impressions but only ${r.clicks} clicks.`,
      recommendation: "Improve the page that targets this query (content depth, headings, internal links) to move it onto page one.",
      evidence: { position: Number(pos(r.position)), impressions: r.impressions, clicks: r.clicks },
    });
  }

  const lowCtr = current
    .filter((r) => r.position <= t.lowCtr.maxPosition && r.impressions >= t.lowCtr.minImpressions && r.ctr < expectedCtr(r.position) * t.lowCtr.belowBenchmark)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, t.lowCtr.limit);
  for (const r of lowCtr) {
    out.push({
      kind: "low_ctr",
      dedupe_key: `low_ctr:${r.query}`,
      subject: r.query,
      summary: `“${r.query}” ranks at position ${pos(r.position)} but only ${pct(r.ctr)} of searchers click (typically about ${pct(expectedCtr(r.position))}).`,
      recommendation: "Rewrite the page title and meta description to match what people searching this are looking for.",
      evidence: { position: Number(pos(r.position)), impressions: r.impressions, clicks: r.clicks, ctr: Number(r.ctr.toFixed(4)) },
    });
  }

  const before = new Map(previous.map((r) => [r.query, r]));
  const declining = current
    .map((r) => ({ r, p: before.get(r.query) }))
    .concat(
      // queries that disappeared entirely this period
      previous.filter((p) => !current.some((c) => c.query === p.query)).map((p) => ({ r: { query: p.query, clicks: 0, impressions: 0, ctr: 0, position: 0 }, p }))
    )
    .filter(({ r, p }) => p && p.clicks >= t.declining.minPreviousClicks && r.clicks <= p.clicks * t.declining.dropRatio)
    .sort((a, b) => b.p!.clicks - b.r.clicks - (a.p!.clicks - a.r.clicks))
    .slice(0, t.declining.limit);
  for (const { r, p } of declining) {
    out.push({
      kind: "declining",
      dedupe_key: `declining:${r.query}`,
      subject: r.query,
      summary: `Clicks for “${r.query}” fell from ${p!.clicks} to ${r.clicks} compared with the previous 28 days.`,
      recommendation: "Check whether the page changed or a competitor overtook it, and refresh the content if it's out of date.",
      evidence: { clicks: r.clicks, previous_clicks: p!.clicks, position: r.position ? Number(pos(r.position)) : 0, previous_position: Number(pos(p!.position)) },
    });
  }
  return out;
}

export function analyseEngagement(pages: PageEngagement[]): SeoSuggestionDraft[] {
  const t = THRESHOLDS.lowEngagement;
  return pages
    .filter((p) => p.sessions >= t.minSessions && p.engagementRate < t.maxEngagementRate)
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, t.limit)
    .map((p) => ({
      kind: "low_engagement" as const,
      dedupe_key: `low_engagement:${p.page}`,
      subject: p.page,
      summary: `${p.page} had ${p.sessions} visits but only ${pct(p.engagementRate)} of visits engaged.`,
      recommendation: "Make sure the page answers what visitors came for: clearer headline, quicker route to the next step, faster loading.",
      evidence: { sessions: p.sessions, engagement_rate: Number(p.engagementRate.toFixed(4)) },
    }));
}
