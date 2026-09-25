import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'

const GRAPH_API_VERSION = 'v26.0'
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

/**
 * GET /api/auth/meta/callback
 *
 * OAuth callback from Meta. Exchanges the auth code for a short-lived token,
 * trades that for a long-lived (~60 day) token, and stores it. Mirrors
 * /api/auth/google/callback in shape.
 *
 * Unlike Google, Meta issues no refresh token for a standard user access
 * token — the long-lived token is the best available, and once it expires
 * the client has to click "Connect" again (see 004_meta_oauth.sql).
 *
 * Query params:
 *   code: string — authorization code from Meta
 *   state: string — clientId (passed during initiate)
 *   error?: string — if present, OAuth was denied
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?meta_error=${encodeURIComponent(error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?meta_error=missing_code_or_state`
      )
    }

    const clientId = decodeURIComponent(state)

    const shortLived = await exchangeCodeForShortLivedToken(code)
    if (!shortLived) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?meta_error=token_exchange_failed`
      )
    }

    const longLived = await exchangeForLongLivedToken(shortLived.access_token)
    if (!longLived) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?meta_error=long_lived_exchange_failed`
      )
    }

    const profile = await fetchMetaProfile(longLived.access_token)
    if (!profile) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?meta_error=profile_fetch_failed`
      )
    }

    const supabase = createAdminSupabaseClient()
    const tokenExpiresAt = new Date(Date.now() + (longLived.expires_in || 0) * 1000).toISOString()
    const scope = ['ads_management', 'ads_read', 'public_profile'].join(' ')

    const { data: connection, error: upsertError } = await supabase
      .from('meta_oauth_connections')
      .upsert([
        {
          client_id: clientId,
          meta_account_name: profile.name,
          meta_account_id: profile.id,
          access_token: longLived.access_token,
          token_expires_at: tokenExpiresAt,
          granted_scopes: scope,
          is_active: true,
          last_used_at: new Date().toISOString(),
        },
      ], {
        onConflict: 'client_id,meta_account_id',
      })
      .select('id')
      .single()

    if (upsertError) {
      console.error('[Meta OAuth callback] Supabase upsert failed:', upsertError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?meta_error=db_error`
      )
    }

    await supabase
      .from('scramble_users')
      .update({ meta_connected: true, updated_at: new Date().toISOString() })
      .eq('email', clientId)

    if (connection) {
      await supabase.from('meta_oauth_audit').insert([
        {
          connection_id: connection.id,
          event_type: 'oauth_connected',
          details: { name: profile.name, scopes: scope.split(' ') },
        },
      ])
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?meta_success=true&email=${encodeURIComponent(clientId)}`
    )
  } catch (error) {
    console.error('[Meta OAuth callback]', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?meta_error=internal_error`
    )
  }
}

async function exchangeCodeForShortLivedToken(code: string) {
  try {
    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`

    if (!appId || !appSecret) {
      throw new Error('Missing Meta OAuth secrets (META_APP_ID or META_APP_SECRET)')
    }

    const params = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    })
    const res = await fetch(`${GRAPH_BASE}/oauth/access_token?${params.toString()}`)
    const data = await res.json()
    if (!res.ok) throw new Error(`Meta token exchange failed: ${data.error?.message || res.status}`)
    return data // { access_token, token_type, expires_in } — short-lived, ~1-2 hours
  } catch (error) {
    console.error('[Meta token exchange]', error)
    return null
  }
}

// Trades the short-lived token for a long-lived one (~60 days). This is the
// only "extension" Meta offers for a standard user token — there is no true
// refresh grant, unlike Google's refresh_token.
async function exchangeForLongLivedToken(shortLivedToken: string) {
  try {
    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: appId || '',
      client_secret: appSecret || '',
      fb_exchange_token: shortLivedToken,
    })
    const res = await fetch(`${GRAPH_BASE}/oauth/access_token?${params.toString()}`)
    const data = await res.json()
    if (!res.ok) throw new Error(`Meta long-lived token exchange failed: ${data.error?.message || res.status}`)
    return data // { access_token, token_type, expires_in } — long-lived, ~5,184,000s (60 days)
  } catch (error) {
    console.error('[Meta long-lived token exchange]', error)
    return null
  }
}

async function fetchMetaProfile(accessToken: string) {
  try {
    const proof = await computeAppSecretProof(accessToken)
    const params = new URLSearchParams({ access_token: accessToken, appsecret_proof: proof, fields: 'id,name' })
    const res = await fetch(`${GRAPH_BASE}/me?${params.toString()}`)
    const data = await res.json()
    if (!res.ok) throw new Error(`Meta profile lookup failed: ${data.error?.message || res.status}`)
    return data as { id: string; name: string }
  } catch (error) {
    console.error('[Meta profile fetch]', error)
    return null
  }
}

// Meta's Graph API expects appsecret_proof (HMAC-SHA256 of the access
// token, keyed by the App Secret) on server-side calls once "Require App
// Secret" is enabled for the app. Computed here so the raw App Secret
// never has to leave this function. Mirrors meta-ads-worker/src/worker.js
// (Tweak Reporting's existing Meta integration).
async function computeAppSecretProof(accessToken: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(process.env.META_APP_SECRET || ''),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(accessToken))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
