// Server-only: runs the SEO analysis for one client and stores the results.

import { createAdminSupabaseClient } from "./supabase";
import { analyticsLandingPages, reportingPeriods, searchConsoleQueryRows } from "./google-agency";
import { analyseEngagement, analyseSearch, SeoSuggestionDraft } from "./seo-analysis";

export interface SeoRunResult {
  found: number;
  skipped: string[];
}

export async function runSeoAnalysis(clientId: string): Promise<SeoRunResult | { error: string; status: number }> {
  const supabase = createAdminSupabaseClient();
  const { data: client, error } = await supabase
    .from("scramble_users")
    .select("site_url, analytics_property_id")
    .eq("id", clientId)
    .single();
  if (error || !client) return { error: "Client not found", status: 404 };
  if (!client.site_url && !client.analytics_property_id) {
    return { error: "Assign a Search Console site or GA4 property on the Connections tab first", status: 400 };
  }

  const drafts: SeoSuggestionDraft[] = [];
  const skipped: string[] = [];

  if (client.site_url) {
    try {
      // Search Console data is usually 2 to 3 days behind
      const { current, previous } = reportingPeriods(3);
      const [cur, prev] = await Promise.all([
        searchConsoleQueryRows(client.site_url, current),
        searchConsoleQueryRows(client.site_url, previous),
      ]);
      drafts.push(...analyseSearch(cur, prev));
    } catch (err) {
      console.error("[seo run] search console", err);
      skipped.push("Search Console data couldn't be read");
    }
  } else {
    skipped.push("No Search Console site assigned");
  }

  if (client.analytics_property_id) {
    try {
      const { current } = reportingPeriods(1);
      drafts.push(...analyseEngagement(await analyticsLandingPages(client.analytics_property_id, current)));
    } catch (err) {
      console.error("[seo run] analytics", err);
      skipped.push("Analytics data couldn't be read");
    }
  } else {
    skipped.push("No GA4 property assigned");
  }

  if (drafts.length > 0) {
    const now = new Date().toISOString();
    // Status is omitted on purpose: a suggestion the team already marked
    // accepted, done or dismissed keeps its status when the evidence refreshes.
    const { error: upsertError } = await supabase.from("seo_suggestions").upsert(
      drafts.map((d) => ({ scramble_user_id: clientId, ...d, last_seen_at: now, updated_at: now })),
      { onConflict: "scramble_user_id,dedupe_key" }
    );
    if (upsertError) {
      console.error("[seo run] save", upsertError);
      return { error: "Couldn't save the suggestions", status: 500 };
    }
  }
  return { found: drafts.length, skipped };
}
