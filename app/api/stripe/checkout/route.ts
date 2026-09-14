import { NextRequest, NextResponse } from "next/server";
import { getStripe, priceIdForTier } from "@/lib/stripe";
import { TierKey } from "@/lib/tiers";

export const runtime = "nodejs";

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout Session for a subscription and returns its URL.
 *
 * Body: { email, tier }
 */
export async function POST(request: NextRequest) {
  try {
    const { email, tier } = await request.json();

    if (!email || !tier) {
      return NextResponse.json({ error: "email and tier are required" }, { status: 400 });
    }

    const validTiers: TierKey[] = ["seo", "ads", "full"];
    if (!validTiers.includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      client_reference_id: email,
      line_items: [{ price: priceIdForTier(tier as TierKey), quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { email, tier },
      },
      metadata: { email, tier },
      allow_promotion_codes: true,
      success_url: `${appUrl}/onboarding?email=${encodeURIComponent(email)}&checkout=success`,
      cancel_url: `${appUrl}/auth/signup?tier=${tier}&checkout=cancelled`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe checkout]", err);
    return NextResponse.json({ error: "Internal error creating checkout session" }, { status: 500 });
  }
}
