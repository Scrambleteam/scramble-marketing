// Scramble subscription tiers + service mapping (Herbie 2026-08-31)

export type ServiceKey = 'search_console' | 'analytics' | 'ads' | 'meta_ads'
export type TierKey = 'seo' | 'ads' | 'full'

export interface Tier {
  key: TierKey
  name: string
  tagline: string
  price: string
  priceNote: string
  services: ServiceKey[]
  features: string[]
  highlight?: boolean
  accent: 'blue' | 'gold' | 'gradient'
}

export const TIERS: Tier[] = [
  {
    key: 'seo',
    name: 'SEO',
    tagline: 'Rankings, traffic & search visibility',
    price: '£400',
    priceNote: 'per month',
    services: ['search_console', 'analytics', 'meta_ads'],
    features: [
      'Google Search Console dashboard',
      'Keyword rankings & impressions',
      'Google Analytics dashboard',
      'Traffic & conversion insights',
      'Meta Ads tracking',
      'Weekly automated reports',
    ],
    accent: 'blue',
  },
  {
    key: 'full',
    name: 'Full Package',
    tagline: 'Google SEO, Google Ads & Meta tracking combined',
    price: 'Coming Soon',
    priceNote: '',
    services: ['search_console', 'analytics', 'ads', 'meta_ads'],
    features: [
      'Everything in SEO',
      'Google Ads dashboard',
      'Meta Ads tracking',
      'Unified cross-channel view',
      'Priority automated reports',
      'Full marketing intelligence',
    ],
    highlight: true,
    accent: 'gradient',
  },
  {
    key: 'ads',
    name: 'Google Ads',
    tagline: 'Campaign spend, conversions & ROAS',
    price: 'Coming Soon',
    priceNote: '',
    services: ['ads', 'meta_ads'],
    features: [
      'Google Ads dashboard',
      'Meta Ads dashboard',
      'Campaign performance tracking',
      'Spend & conversion monitoring',
      'ROAS & CPA insights',
      'Weekly automated reports',
    ],
    accent: 'gold',
  },
]

export function servicesForTier(tier: TierKey): ServiceKey[] {
  return TIERS.find((t) => t.key === tier)?.services ?? []
}

export function getTier(tier: TierKey): Tier | undefined {
  return TIERS.find((t) => t.key === tier)
}

export const SERVICE_META: Record<ServiceKey, { label: string; icon: string; desc: string }> = {
  search_console: {
    label: 'Search Console',
    icon: '🔍',
    desc: 'Keyword rankings, impressions & clicks',
  },
  analytics: {
    label: 'Analytics',
    icon: '📈',
    desc: 'Traffic, sessions & user behaviour',
  },
  ads: {
    label: 'Google Ads',
    icon: '💰',
    desc: 'Campaign spend & conversions',
  },
  meta_ads: {
    label: 'Meta Ads',
    icon: '📘',
    desc: 'Facebook & Instagram ad performance',
  },
}
