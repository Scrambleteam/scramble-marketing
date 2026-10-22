import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAdminUser, unauthorizedResponse } from "@/lib/api-auth";

/**
 * PATCH /api/admin/clients/[id]
 *
 * Admin only. Assigns the Google properties a client's dashboard reads
 * through the agency connection. Clients cannot set these themselves.
 *
 * Body: { site_url?, analytics_property_id?, ads_customer_id? } — null clears
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const updates: Record<string, string | null> = {};
  const clean = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

  if ("site_url" in body) {
    const v = clean(body.site_url);
    if (v && !/^(https?:\/\/|sc-domain:)/.test(v)) {
      return NextResponse.json({ error: "Invalid Search Console site" }, { status: 400 });
    }
    updates.site_url = v;
  }
  if ("analytics_property_id" in body) {
    const v = clean(body.analytics_property_id)?.replace(/^properties\//, "") ?? null;
    if (v && !/^\d+$/.test(v)) {
      return NextResponse.json({ error: "Invalid GA4 property ID" }, { status: 400 });
    }
    updates.analytics_property_id = v;
  }
  if ("ads_customer_id" in body) {
    const v = clean(body.ads_customer_id)?.replace(/-/g, "") ?? null;
    if (v && !/^\d{10}$/.test(v)) {
      return NextResponse.json({ error: "Invalid Google Ads customer ID" }, { status: 400 });
    }
    updates.ads_customer_id = v;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data: current, error: readError } = await supabase
      .from("scramble_users")
      .select("site_url, analytics_property_id, ads_customer_id")
      .eq("id", id)
      .single();
    if (readError || !current) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const merged = { ...current, ...updates };
    const { data, error } = await supabase
      .from("scramble_users")
      .update({
        ...updates,
        // "Connected" now means an admin has assigned at least one property
        google_connected: !!(merged.site_url || merged.analytics_property_id || merged.ads_customer_id),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, site_url, analytics_property_id, ads_customer_id, google_connected")
      .single();

    if (error) {
      console.error("[admin client PATCH]", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, client: data });
  } catch (err) {
    console.error("[admin client PATCH]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
