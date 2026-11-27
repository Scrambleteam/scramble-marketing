/**
 * Server-only: drafts "wins" for a client from their real data, for the team
 * to edit and approve. Every draft is built from numbers we read, with the
 * evidence saved beside it, so nothing is invented. Nothing is shown to the
 * client until a team member publishes it.
 */

import { createAdminSupabaseClient } from "./supabase";
import {
  analyticsEnquiries,
  reportingPeriods,
  searchConsoleMetrics,
  searchConsolePageOneKeywords,
  searchConsoleQueryRows,
} from "./google-agency";

export interface WinDraft {
  dedupe_key: string;
  body: string;
  evidence: Record<string, number | string>;
}

const num = (n: number) => new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(n);

async function attempt<T>(skipped: string[], label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    console.error("[win drafts]", label, err);
    skipped.push(`${label} couldn't be read`);
    return null;
  }
}

export async function draftWins(client: { site_url: string | null; analytics_property_id: string | null }, month = new Date().toISOString().slice(0, 7)) {
  const drafts: WinDraft[] = [];
  const skipped: string[] = [];

  if (client.site_url) {
    const site = client.site_url;
    const sc = await attempt(skipped, "Search Console", () => searchConsoleMetrics(site));
    const clicks = sc?.metrics.find((m) => m.label === "Clicks");
    if (clicks && clicks.current >= 20 && clicks.previous >= 10 && clicks.current >= clicks.previous * 1.1) {
      const pct = Math.round(((clicks.current - clicks.previous) / clicks.previous) * 100);
      drafts.push({
        dedupe_key: `clicks-up:${month}`,
        body: `Clicks from Google search rose ${pct}% to ${num(clicks.current)} over the last 28 days, compared with ${num(clicks.previous)} in the 28 days before.`,
        evidence: { clicks_now: clicks.current, clicks_before: clicks.previous },
      });
    }

    const rows = await attempt(skipped, "Search queries", async () => {
      const { current, previous } = reportingPeriods(3);
      const [cur, prev] = await Promise.all([searchConsoleQueryRows(site, current), searchConsoleQueryRows(site, previous)]);
      return { cur, prev };
    });
    if (rows) {
      const before = new Map(rows.prev.map((r) => [r.query, r.position]));
      rows.cur
        .filter((r) => r.position <= 10 && r.impressions >= 20 && (before.get(r.query) ?? 99) > 10)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 3)
        .forEach((r) =>
          drafts.push({
            dedupe_key: `page-one:${r.query.toLowerCase()}:${month}`,
            body: `Now on page one of Google for “${r.query}”.`,
            evidence: {
              query: r.query,
              position_now: Number(r.position.toFixed(1)),
              position_before: before.has(r.query) ? Number((before.get(r.query) as number).toFixed(1)) : "not ranking",
              impressions: r.impressions,
            },
          })
        );
    }

    const p1 = await attempt(skipped, "Page one keywords", () => searchConsolePageOneKeywords(site));
    if (p1 && p1.current - p1.previous >= 2) {
      drafts.push({
        dedupe_key: `page-one-count:${month}`,
        body: `The number of searches where the site appears on page one of Google rose from ${p1.previous} to ${p1.current}.`,
        evidence: { page_one_now: p1.current, page_one_before: p1.previous },
      });
    }
  }

  if (client.analytics_property_id) {
    const property = client.analytics_property_id;
    const enq = await attempt(skipped, "Enquiries", () => analyticsEnquiries(property));
    if (enq && enq.current >= 3 && enq.current > enq.previous) {
      drafts.push({
        dedupe_key: `enquiries-up:${month}`,
        body: `${num(enq.current)} enquiries came from organic search over the last 28 days${enq.previous > 0 ? `, up from ${num(enq.previous)} in the 28 days before` : ""}.`,
        evidence: { enquiries_now: enq.current, enquiries_before: enq.previous },
      });
    }
  }

  return { drafts, skipped };
}

/** Saves new drafts for a client; ones already saved this month (even if edited or published) are left alone */
export async function saveWinDrafts(clientId: string, drafts: WinDraft[], by: string) {
  if (drafts.length === 0) return 0;
  const { data, error } = await createAdminSupabaseClient()
    .from("client_updates")
    .upsert(
      drafts.map((d) => ({
        scramble_user_id: clientId,
        kind: "win",
        body: d.body,
        status: "draft",
        auto_drafted: true,
        dedupe_key: d.dedupe_key,
        evidence: d.evidence,
        created_by: by,
      })),
      { onConflict: "scramble_user_id,dedupe_key", ignoreDuplicates: true }
    )
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}
