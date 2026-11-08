// Server-only: when a client's payment first went missed. Read-only; it
// doesn't change anything in Stripe or our database.
//
// We take the oldest open (unpaid) invoice on the customer. For a
// subscription that's failing to renew, that's the first missed payment.
// If the client pays, the invoice closes and the count resets.

import { getStripe } from "./stripe";

export const OVERDUE_STATUSES = ["past_due", "unpaid"];
export const DATA_DELETION_DAYS = 30;

/** ISO timestamp of the first missed payment, or null if it can't be found */
export async function paymentMissedSince(stripeCustomerId: string | null): Promise<string | null> {
  if (!stripeCustomerId) return null;
  try {
    const invoices = await getStripe().invoices.list({
      customer: stripeCustomerId,
      status: "open",
      limit: 100,
    });
    if (invoices.data.length === 0) return null;
    const oldest = invoices.data.reduce((a, b) => (a.created <= b.created ? a : b));
    return new Date(oldest.created * 1000).toISOString();
  } catch (err) {
    console.error("[billing overdue] could not read Stripe invoices", err);
    return null;
  }
}
