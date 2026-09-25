import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/meta/initiate
 *
 * Initiates the Meta (Facebook) OAuth flow for a client, so their dashboard
 * can pull Ads Manager performance data automatically. Mirrors
 * /api/auth/google/initiate in shape.
 *
 * Body:
 *   clientId: string — the client's ID (their account email) in Scramble
 *
 * Returns:
 *   { authUrl: string } — redirect the user to this URL
 */
export async function POST(request: NextRequest) {
  try {
    const { clientId } = await request.json()

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      )
    }

    const appId = process.env.META_APP_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`

    if (!appId || !process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error('Missing Meta OAuth env vars (META_APP_ID or NEXT_PUBLIC_APP_URL)')
    }

    // Scramble runs and optimizes campaigns on the client's behalf (this
    // isn't a read-only reporting tool), so this requests write access:
    //   ads_management — create/edit/pause campaigns, ad sets, ads, budgets
    //   ads_read       — pull Insights (spend, clicks, conversions) for reporting
    //   public_profile — basic profile, to show "connected as <name>"
    // ads_management is a Standard Access permission under Advanced Access
    // review — see meta-ads-worker/README.md (Tweak's existing Meta app) for
    // the App Review process. It also normally requires the client to add
    // Scramble's Business Manager as a partner (Admin or Advertiser role) on
    // their ad account, not just click through this login consent screen —
    // flag that to clients during onboarding.
    const scopes = ['ads_management', 'ads_read', 'public_profile'].join(',')

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      state: encodeURIComponent(clientId), // pass clientId as state for security
    })

    const authUrl = `https://www.facebook.com/v26.0/dialog/oauth?${params.toString()}`

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('[Meta OAuth initiate]', error)
    return NextResponse.json(
      { error: 'Failed to initiate Meta OAuth flow' },
      { status: 500 }
    )
  }
}
