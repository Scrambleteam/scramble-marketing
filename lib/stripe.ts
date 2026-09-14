import Stripe from 'stripe'
import type { TierKey } from './tiers'

// Lazy singleton — mirrors lib/supabase.ts so a missing env var at build
// time doesn't crash the build, only a runtime call that actually needs it.
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('Missing Stripe env var: STRIPE_SECRET_KEY')
    }
    _stripe = new Stripe(key, {
      apiVersion: '2025-08-27.basil',
    })
  }
  return _stripe
}

// Maps each subscription tier to its Stripe Price ID. Create these Products
// + Prices in the Stripe Dashboard (or via the API) and set the resulting
// price IDs as env vars — see STRIPE_SETUP.md for the walkthrough.
export function priceIdForTier(tier: TierKey): string {
  const map: Record<TierKey, string | undefined> = {
    seo: process.env.STRIPE_PRICE_SEO,
    ads: process.env.STRIPE_PRICE_ADS,
    full: process.env.STRIPE_PRICE_FULL,
  }
  const priceId = map[tier]
  if (!priceId) {
    throw new Error(`Missing Stripe price ID env var for tier "${tier}"`)
  }
  return priceId
}

// Statuses that should count as "the client has active access".
export const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing'] as const
