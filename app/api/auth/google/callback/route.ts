import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'

/**
 * GET /api/auth/google/callback
 * 
 * OAuth callback from Google. Exchanges auth code for tokens and stores them.
 */
export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9)
  
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Log the callback initiation
    console.log(`[${requestId}] OAuth callback initiated`, {
      hasCode: !!code,
      hasState: !!state,
      error,
      errorDescription
    })

    // User denied access
    if (error) {
      console.warn(`[${requestId}] User denied access:`, error, errorDescription)
      return redirectWithError('access_denied')
    }

    if (!code || !state) {
      console.error(`[${requestId}] Missing required parameters`, { hasCode: !!code, hasState: !!state })
      return redirectWithError('missing_params')
    }

    const clientId = decodeURIComponent(state)
    console.log(`[${requestId}] Client ID:`, clientId)

    // Exchange code for tokens
    console.log(`[${requestId}] Exchanging authorization code for tokens...`)
    const tokenData = await exchangeCodeForTokens(code, requestId)
    
    if (!tokenData) {
      console.error(`[${requestId}] Token exchange failed`)
      return redirectWithError('token_exchange_failed')
    }

    console.log(`[${requestId}] Token exchange successful, fetching profile...`)

    // Get Google account info
    const googleProfile = await getGoogleProfile(tokenData.access_token, requestId)
    if (!googleProfile?.email || !googleProfile?.id) {
      console.error(`[${requestId}] Failed to get Google profile or missing email/id`, { 
        hasEmail: !!googleProfile?.email,
        hasId: !!googleProfile?.id
      })
      return redirectWithError('profile_fetch_failed')
    }

    console.log(`[${requestId}] Got Google profile:`, {
      email: googleProfile.email,
      id: googleProfile.id
    })

    // Store tokens in database
    console.log(`[${requestId}] Storing tokens in database...`)
    const stored = await storeGoogleConnection({
      clientId,
      googleProfile,
      tokens: tokenData,
      requestId
    })

    if (!stored) {
      console.error(`[${requestId}] Failed to store tokens in database`)
      return redirectWithError('db_error')
    }

    console.log(`[${requestId}] Tokens stored successfully`)

    // Update user profile
    await updateUserGoogleStatus(clientId, true, requestId)

    console.log(`[${requestId}] OAuth flow completed successfully`)
    return redirectWithSuccess(clientId)

  } catch (error) {
    console.error(`[${requestId}] Unexpected error in OAuth callback:`, error)
    return redirectWithError('internal_error')
  }
}

/**
 * Exchange Google authorization code for tokens
 */
async function exchangeCodeForTokens(code: string, requestId: string) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const redirectUri = `${appUrl}/api/auth/google/callback`

    if (!clientId || !clientSecret) {
      throw new Error('Missing Google OAuth credentials in environment')
    }

    console.log(`[${requestId}] Making token exchange request to Google...`)

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Google token endpoint returned ${response.status}: ${errorData}`)
    }

    const data = await response.json()
    console.log(`[${requestId}] Token exchange response received`, {
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      hasIdToken: !!data.id_token,
      expiresIn: data.expires_in
    })

    return data
  } catch (error) {
    console.error(`[${requestId}] Token exchange error:`, error)
    return null
  }
}

/**
 * Fetch Google profile information
 */
async function getGoogleProfile(accessToken: string, requestId: string) {
  try {
    console.log(`[${requestId}] Fetching Google profile...`)

    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Google userinfo endpoint returned ${response.status}`)
    }

    const profile = await response.json()
    return {
      email: profile.email,
      id: profile.id,
      name: profile.name
    }
  } catch (error) {
    console.error(`[${requestId}] Failed to fetch Google profile:`, error)
    return null
  }
}

/**
 * Store or update Google OAuth connection in database
 */
async function storeGoogleConnection({
  clientId,
  googleProfile,
  tokens,
  requestId
}: {
  clientId: string
  googleProfile: { email: string; id: string; name?: string }
  tokens: any
  requestId: string
}) {
  try {
    const supabase = createAdminSupabaseClient()
    
    const tokenExpiresAt = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString()
    const scopes = tokens.scope || ''

    console.log(`[${requestId}] Upserting connection`, {
      clientId,
      googleAccountEmail: googleProfile.email,
      tokenExpiresAt,
      scopes: scopes.substring(0, 50) + '...'
    })

    const { error, data } = await supabase
      .from('google_oauth_connections')
      .upsert([
        {
          client_id: clientId,
          google_account_email: googleProfile.email,
          google_account_id: googleProfile.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: tokenExpiresAt,
          granted_scopes: scopes,
          is_active: true,
          last_used_at: new Date().toISOString(),
        }
      ], {
        onConflict: 'client_id,google_account_id'
      })
      .select('id')

    if (error) {
      console.error(`[${requestId}] Upsert error:`, error)
      // Try alternative upsert syntax if the first one fails
      return await fallbackUpsert(clientId, googleProfile, tokens, requestId)
    }

    console.log(`[${requestId}] Upsert successful, connection ID:`, data?.[0]?.id)
    return true
  } catch (error) {
    console.error(`[${requestId}] Store error:`, error)
    return false
  }
}

/**
 * Fallback upsert using update then insert pattern
 */
async function fallbackUpsert(
  clientId: string,
  googleProfile: { email: string; id: string; name?: string },
  tokens: any,
  requestId: string
) {
  try {
    console.log(`[${requestId}] Using fallback upsert strategy...`)
    
    const supabase = createAdminSupabaseClient()
    const tokenExpiresAt = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString()
    const scopes = tokens.scope || ''

    // First, try to update existing connection
    const { data: existing } = await supabase
      .from('google_oauth_connections')
      .select('id')
      .eq('client_id', clientId)
      .eq('google_account_id', googleProfile.id)
      .single()

    if (existing?.id) {
      console.log(`[${requestId}] Found existing connection, updating...`)
      
      const { error: updateError } = await supabase
        .from('google_oauth_connections')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: tokenExpiresAt,
          granted_scopes: scopes,
          is_active: true,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (updateError) {
        console.error(`[${requestId}] Update failed:`, updateError)
        return false
      }
      
      console.log(`[${requestId}] Update successful`)
      return true
    }

    // No existing connection, insert new one
    console.log(`[${requestId}] No existing connection, inserting new...`)
    
    const { error: insertError } = await supabase
      .from('google_oauth_connections')
      .insert([
        {
          client_id: clientId,
          google_account_email: googleProfile.email,
          google_account_id: googleProfile.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: tokenExpiresAt,
          granted_scopes: scopes,
          is_active: true,
          last_used_at: new Date().toISOString(),
        }
      ])

    if (insertError) {
      console.error(`[${requestId}] Insert failed:`, insertError)
      return false
    }

    console.log(`[${requestId}] Insert successful`)
    return true
  } catch (error) {
    console.error(`[${requestId}] Fallback upsert error:`, error)
    return false
  }
}

/**
 * Update user's Google connection status
 */
async function updateUserGoogleStatus(clientId: string, connected: boolean, requestId: string) {
  try {
    const supabase = createAdminSupabaseClient()
    await supabase
      .from('scramble_users')
      .update({
        google_connected: connected,
        updated_at: new Date().toISOString()
      })
      .eq('email', clientId)
    
    console.log(`[${requestId}] User status updated`)
  } catch (error) {
    console.error(`[${requestId}] Failed to update user status:`, error)
    // Non-blocking error
  }
}

/**
 * Redirect with error
 */
function redirectWithError(errorCode: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const url = new URL(`${appUrl}/onboarding`)
  url.searchParams.set('oauth_error', errorCode)
  return NextResponse.redirect(url)
}

/**
 * Redirect with success
 */
function redirectWithSuccess(clientId: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const url = new URL(`${appUrl}/onboarding`)
  url.searchParams.set('oauth_success', 'true')
  url.searchParams.set('email', clientId)
  return NextResponse.redirect(url)
}
