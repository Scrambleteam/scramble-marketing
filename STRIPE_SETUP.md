# Stripe billing setup

The code for checkout, webhooks and the billing portal is already in place
(`lib/stripe.ts`, `app/api/stripe/*`). To turn it on, do the following in
the Stripe Dashboard and then set the resulting values as environment
variables (locally in `.env.local`, and in Vercel → Settings → Environment
Variables so production picks them up too).

## 1. Create the three Prices

In [Stripe Dashboard → Product catalog](https://dashboard.stripe.com/test/products),
create one Product per tier, each with a **recurring monthly** Price in
**GBP**:

| Product name | Price    |
|---------------|----------|
| SEO           | £400/mo  |
| Google Ads    | £450/mo  |
| Full Package  | £750/mo  |

Copy each Price's ID (starts `price_...`) into:

```
STRIPE_PRICE_SEO=price_...
STRIPE_PRICE_ADS=price_...
STRIPE_PRICE_FULL=price_...
```

## 2. API keys

[Dashboard → Developers → API keys](https://dashboard.stripe.com/test/apikeys):

```
STRIPE_SECRET_KEY=sk_test_...
```

Start in **test mode** (the toggle top-right of the Dashboard) so you can
run through a signup with a test card before going live.

## 3. Webhook

[Dashboard → Developers → Webhooks → Add endpoint](https://dashboard.stripe.com/test/webhooks):

- Endpoint URL: `https://scramblemarketing.co.uk/api/stripe/webhook`
- Events to send: `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`

Copy the "Signing secret" it gives you into:

```
STRIPE_WEBHOOK_SECRET=whsec_...
```

To test locally before deploying, use the Stripe CLI instead:
`stripe listen --forward-to localhost:3000/api/stripe/webhook` — it prints
a temporary webhook secret you can use for local testing.

## 4. Run the database migration

Run `supabase/migrations/003_stripe_billing.sql` against your Supabase
project (Supabase Dashboard → SQL Editor → paste and run, or via the
Supabase CLI). It adds the columns the webhook writes to:
`stripe_customer_id`, `stripe_subscription_id`, `subscription_status`,
`current_period_end`.

## 5. Install the dependency

`stripe` has been added to `package.json` — run `npm install` to pull it
in (already done if you're reading this after that step).

## 6. Test it

With test-mode keys in place, go through `/pricing` → sign up → Stripe
Checkout using a test card: `4242 4242 4242 4242`, any future expiry, any
CVC. You should land back on `/onboarding`, and the user's row in
`scramble_users` should show `subscription_status: trialing`.

Once everything checks out, switch the Dashboard to **live mode**, repeat
steps 1–3 for live Products/Price/webhook (test and live are separate),
and swap the env vars to the live key values.
