import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, ACTIVE_SUBSCRIPTION_STATUSES } from "@/lib/stripe";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";

// Stripe moved current_period_end from the Subscription object onto each
// SubscriptionItem (flexible billing mode) — read it off the first item.
function subscriptionPeriodEnd(subscription: Stripe.Subscription): string | null {
  const end = subscription.items.data[0]?.current_period_end;
  return end ? new Date(end * 1000).toISOString() : null;
}

/**
 * POST /api/stripe/webhook
 * Stripe sends subscription lifecycle events here. Verifies the signature,
 * then syncs billing state onto the matching scramble_users row.
 *
 * Configure this URL (https://yourdomain/api/stripe/webhook) in the Stripe
 * Dashboard → Developers → Webhooks, listening for:
 *   checkout.session.completed
 *   customer.subscription.updated
 *   customer.subscription.deleted
 */
export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.metadata?.email || session.client_reference_id;
        const tier = session.metadata?.tier;
        if (!email || typeof session.subscription !== "string" || typeof session.customer !== "string") break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        const { error, data } = await supabase
          .from("scramble_users")
          .update({
            stripe_customer_id: session.customer,
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            current_period_end: subscriptionPeriodEnd(subscription),
            is_active: ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status),
            ...(tier ? { tier } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq("email", email)
          .select();

        if (error) {
          throw new Error(`Supabase update failed for checkout.session.completed (email=${email}): ${error.message}`);
        }
        if (!data || data.length === 0) {
          throw new Error(`No scramble_users row matched email=${email} for checkout.session.completed`);
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

        const status = event.type === "customer.subscription.deleted" ? "canceled" : subscription.status;

        const { error, data } = await supabase
          .from("scramble_users")
          .update({
            subscription_status: status,
            current_period_end: subscriptionPeriodEnd(subscription),
            is_active: ACTIVE_SUBSCRIPTION_STATUSES.includes(status),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId)
          .select();

        if (error) {
          throw new Error(`Supabase update failed for ${event.type} (customer=${customerId}): ${error.message}`);
        }
        if (!data || data.length === 0) {
          throw new Error(`No scramble_users row matched stripe_customer_id=${customerId} for ${event.type}`);
        }
        break;
      }

      default:
        // Ignore other event types.
        break;
    }
  } catch (err) {
    console.error(`[stripe webhook] failed handling ${event.type}`, err);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
