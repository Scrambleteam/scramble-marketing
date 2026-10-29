import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { AGENCY_GOOGLE_EMAIL } from '@/lib/admin'
import { OAUTH_STATE_COOKIE } from '@/lib/google-agency'

/**
 * GET /api/auth/google/callback
 *
 * OAuth callback for the agency Google connection. Verifies the state cookie
 * set by /initiate, checks the account is the agency account, and stores its
 * tokens as the single agency connection. Redirects back to /admin.
 */
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const done = (query: string) => {
    const response = NextResponse.redirect(`${appUrl}/admin?${query}`)
    response.cookies.delete({ name: OAUTH_STATE_COOKIE, path: '/api/auth/google' })
    return response
  }

  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const oauthError = searchParams.get('error')

    if (oauthError) return done(`google_error=${encodeURIComponent(oauthError)}`)

    let started: { nonce?: string; by?: string } = {}
    try {
      started = JSON.parse(request.cookies.get(OAUTH_STATE_COOKIE)?.value || '{}')
    } catch {
      // fall through to the state check below
    }
    if (!code || !state || !started.nonce || state !== started.nonce) {
      return done('google_error=invalid_state')
    }

    const token = await exchangeCodeForToken(code)
    if (!token) return done('google_error=token_exchange_failed')

    const profile = await getGoogleProfile(token.access_token)
    if (!profile?.email) return done('google_error=profile_fetch_failed')

    // Only the agency account may be connected — clients add this address to
    // their accounts, so any other account would see none of their data.
    if (profile.email.toLowerCase() !== AGENCY_GOOGLE_EMAIL) {
      await revokeToken(token.refresh_token || token.access_token)
      return done(`google_error=wrong_account&account=${encodeURIComponent(profile.email)}`)
    }

    if (!token.refresh_token) return done('google_error=no_refresh_token')

    const supabase = createAdminSupabaseClient()
    const { error } = await supabase.from('agency_google_connection').upsert(
      [
        {
          provider: 'google',
          google_account_email: profile.email,
          google_account_id: profile.id,
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          token_expires_at: new Date(Date.now() + token.expires_in * 1000).toISOString(),
          granted_scopes: token.scope,
          connected_by_email: started.by || null,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'provider' }
    )

    if (error) {
      console.error('[OAuth callback] Supabase upsert failed:', error)
      return done('google_error=db_error')
    }

    return done('google=connected')
  } catch (error) {
    console.error('[OAuth callback]', error)
    return done('google_error=internal_error')
  }
}

async function exchangeCodeForToken(code: string) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }).toString(),
    })
    if (!response.ok) throw new Error(`Token exchange failed: ${response.status}`)
    return (await response.json()) as {
      access_token: string
      refresh_token?: string
      expires_in: number
      scope: string
    }
  } catch (error) {
    console.error('[Token exchange]', error)
    return null
  }
}

async function getGoogleProfile(accessToken: string) {
  try {
    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) throw new Error(`Profile fetch failed: ${response.status}`)
    const data = await response.json()
    return { email: data.email as string, id: (data.sub || data.id) as string }
  } catch (error) {
    console.error('[Google profile fetch]', error)
    return null
  }
}

async function revokeToken(token: string) {
  await fetch('https://oauth2.googleapis.com/revoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }).toString(),
  }).catch(() => {})
}
