import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";

/**
 * GET /api/scramble/me?email=...
 * Returns the scramble_users profile for the authenticated user.
 * Users can only fetch their own profile.
 */
export async function GET(request: NextRequest) {
  try {
    // Auth gate: user must be logged in
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    // Users can only fetch their own profile
    if (email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden: can only access your own profile" }, { status: 403 });
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("scramble_users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[scramble me GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * PATCH /api/scramble/me
 * Updates a scramble_users profile.
 * Users can only update their own profile.
 * Body: { email, ...fieldsToUpdate }
 */
export async function PATCH(request: NextRequest) {
  try {
    // Auth gate: user must be logged in
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const { email, ...updates } = body;

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    // Users can only update their own profile
    if (email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden: can only update your own profile" }, { status: 403 });
    }

    // Whitelist updatable fields
    const allowed: Record<string, any> = {};
    if ("company_name" in updates) allowed.company_name = updates.company_name;
    if ("tier" in updates) allowed.tier = updates.tier;
    if ("services" in updates) allowed.services = updates.services;
    if ("onboarding_complete" in updates) allowed.onboarding_complete = updates.onboarding_complete;
    if ("google_connected" in updates) allowed.google_connected = updates.google_connected;
    if ("site_url" in updates) allowed.site_url = updates.site_url;
    if ("analytics_property_id" in updates) allowed.analytics_property_id = updates.analytics_property_id;
    if ("ads_customer_id" in updates) allowed.ads_customer_id = updates.ads_customer_id;
    if ("website_domain" in updates) allowed.website_domain = updates.website_domain;
    allowed.updated_at = new Date().toISOString();

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("scramble_users")
      .update(allowed)
      .eq("email", email)
      .select()
      .single();

    if (error) {
      console.error("[scramble me PATCH]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, user: data });
  } catch (err) {
    console.error("[scramble me PATCH]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
