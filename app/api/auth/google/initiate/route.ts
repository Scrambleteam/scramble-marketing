import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, unauthorizedResponse } from '@/lib/api-auth'
import { AGENCY_GOOGLE_EMAIL } from '@/lib/admin'
import { AGENCY_GOOGLE_SCOPES, OAUTH_STATE_COOKIE } from '@/lib/google-agency'

/**
 * POST /api/auth/google/initiate
 *
 * Admin only. Starts the OAuth flow that connects the agency Google account
 * (the account clients add to their Search Console, GA4 and Google Ads).
 * Clients no longer connect Google themselves.
 *
 * Returns: { authUrl } — redirect the browser to this URL
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request)
  if (!admin) return unauthorizedResponse('Admin access required')

  const clientId = process.env.GOOGLE_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!clientId || !appUrl) {
    console.error('[OAuth initiate] Missing GOOGLE_CLIENT_ID or NEXT_PUBLIC_APP_URL')
    return NextResponse.json({ error: 'Google OAuth is not configured' }, { status: 500 })
  }

  // Random state, echoed back by Google and checked against this cookie in
  // the callback, so only a flow started by a signed-in admin can complete.
  const nonce = crypto.randomUUID()

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl}/api/auth/google/callback`,
    response_type: 'code',
    scope: AGENCY_GOOGLE_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent', // always return a refresh token
    login_hint: AGENCY_GOOGLE_EMAIL,
    state: nonce,
  })

  const response = NextResponse.json({
    authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  })
  response.cookies.set(OAUTH_STATE_COOKIE, JSON.stringify({ nonce, by: admin.email }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/google',
    maxAge: 600,
  })
  return response
}
