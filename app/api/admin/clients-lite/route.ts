import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAdminUser, unauthorizedResponse } from "@/lib/api-auth";

/** GET /api/admin/clients-lite: client names only, for pickers. Admin only. */
export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");
  const { data, error } = await createAdminSupabaseClient()
    .from("scramble_users")
    .select("id, company_name")
    .order("company_name");
  if (error) return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  return NextResponse.json({ clients: data ?? [] });
}
