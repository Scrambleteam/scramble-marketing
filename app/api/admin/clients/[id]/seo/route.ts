import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAdminUser, unauthorizedResponse } from "@/lib/api-auth";
import { runSeoAnalysis } from "@/lib/seo-run";

const UUID_RE = /^[0-9a-f-]{36}$/i;
const COLUMNS = "id, created_at, kind, subject, summary, recommendation, evidence, last_seen_at, status, status_by, status_at";

/** GET /api/admin/clients/[id]/seo: the client's SEO suggestions. Admin only. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("seo_suggestions")
    .select(COLUMNS)
    .eq("scramble_user_id", id)
    .order("last_seen_at", { ascending: false })
    .limit(300);
  if (error) {
    console.error("[admin seo GET]", error);
    return NextResponse.json({ error: "Failed to load suggestions" }, { status: 500 });
  }
  return NextResponse.json({ suggestions: data ?? [] });
}

/** POST /api/admin/clients/[id]/seo: run the analysis now and store the results. Admin only. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const result = await runSeoAnalysis(id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
