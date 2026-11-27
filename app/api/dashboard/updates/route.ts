import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";

/**
 * GET /api/dashboard/updates
 *
 * The signed-in client's PUBLISHED updates (wins, what we did, what's next).
 * Drafts, evidence and who approved them are never returned: only kind, text
 * and the publish date.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user?.email) return unauthorizedResponse();

  const supabase = createAdminSupabaseClient();
  const { data: profile } = await supabase.from("scramble_users").select("id").eq("email", user.email).single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("client_updates")
    .select("id, kind, body, published_at")
    .eq("scramble_user_id", profile.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(100);
  if (error) {
    console.error("[dashboard updates]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
  const response = NextResponse.json({ updates: data ?? [] });
  response.headers.set("Cache-Control", "private, max-age=60");
  return response;
}
