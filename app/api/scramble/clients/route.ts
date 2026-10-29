import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from "@/lib/api-auth";
import { isAdminEmail } from "@/lib/admin";
import { ADMIN_CLIENT_COLUMNS } from "@/lib/client-status";

/**
 * GET /api/scramble/clients
 * Admin route — lists all onboarded Scramble clients (for Gabriel + Herbie).
 * Pulls from scramble_users, newest first.
 * Requires admin authentication.
 */
export async function GET(_request: NextRequest) {
  // Auth gate: admin only
  const user = await getAuthenticatedUser(_request);
  if (!user) return unauthorizedResponse();
  if (!isAdminEmail(user.email)) return forbiddenResponse("Admin access required");
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("scramble_users")
      .select(ADMIN_CLIENT_COLUMNS)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[scramble clients]", error);
      return NextResponse.json({ error: error.message, clients: [] }, { status: 500 });
    }

    return NextResponse.json({ clients: data || [] });
  } catch (err) {
    console.error("[scramble clients]", err);
    return NextResponse.json({ error: "Internal error", clients: [] }, { status: 500 });
  }
}
