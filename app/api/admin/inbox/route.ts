import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAdminUser, unauthorizedResponse } from "@/lib/api-auth";

const COLUMNS =
  "id, scramble_user_id, kind, subject, summary, recommendation, evidence, last_seen_at, status, status_by, status_at, owner, rating, rating_by, note, scramble_users(company_name, website_domain)";

/**
 * GET /api/admin/inbox
 * Admin only. INTERNAL: the worker inbox across all clients. Never exposed to clients.
 *
 *   ?summary=1  returns only counts: { total, byClient: { [clientId]: n } } of suggestions still to review
 *   otherwise   returns every suggestion (newest first, up to 500) with its client's name
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");

  const supabase = createAdminSupabaseClient();

  if (new URL(request.url).searchParams.get("summary")) {
    const { data, error } = await supabase
      .from("seo_suggestions")
      .select("scramble_user_id")
      .eq("status", "new")
      .limit(5000);
    if (error) {
      console.error("[admin inbox summary]", error);
      return NextResponse.json({ error: "Failed to load" }, { status: 500 });
    }
    const byClient: Record<string, number> = {};
    for (const row of data ?? []) byClient[row.scramble_user_id] = (byClient[row.scramble_user_id] ?? 0) + 1;
    return NextResponse.json({ total: data?.length ?? 0, byClient });
  }

  const { data, error } = await supabase
    .from("seo_suggestions")
    .select(COLUMNS)
    .order("last_seen_at", { ascending: false })
    .limit(500);
  if (error) {
    console.error("[admin inbox]", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
  return NextResponse.json({ suggestions: data ?? [] });
}
