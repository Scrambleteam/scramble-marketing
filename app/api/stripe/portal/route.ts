import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from "@/lib/api-auth";

export const runtime = "nodejs";

/**
 * POST /api/stripe/portal
 * Creates a Stripe Billing Portal session so a client can manage or cancel
 * their own subscription. Body: { email }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedResponse();

    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }
    if (email.toLowerCase() !== user.email?.toLowerCase()) {
      return forbiddenResponse("Can only manage your own billing");
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("scramble_users")
      .select("stripe_customer_id")
      .eq("email", email)
      .single();

    if (error || !data?.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account found for this user yet" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const stripe = getStripe();

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${appUrl}/dashboard/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("[stripe portal]", err);
    return NextResponse.json({ error: "Internal error creating billing portal session" }, { status: 500 });
  }
}
