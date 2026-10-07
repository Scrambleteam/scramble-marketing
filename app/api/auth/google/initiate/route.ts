import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/google/initiate
 * 
 * Initiates Google OAuth flow for a client.
 * 
 * Body:
 *   clientId: string — the client's ID in the Scramble database
 * 
 * Returns:
 *   { authUrl: string } — redirect user to this URL
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

    // Build the Google OAuth URL
    const clientIdSecret = process.env.GOOGLE_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    
    if (!clientIdSecret || !redirectUri) {
      throw new Error('Missing Google OAuth env vars (GOOGLE_CLIENT_ID or NEXT_PUBLIC_APP_URL)')
    }

    const scopes = [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email', // read the account email
      'https://www.googleapis.com/auth/userinfo.profile', // read the account name/id
      'https://www.googleapis.com/auth/webmasters', // Search Console (full access — add + read sites)
      'https://www.googleapis.com/auth/analytics.readonly', // Google Analytics (read)
      'https://www.googleapis.com/auth/analytics.edit', // Google Analytics Admin (manage)
      'https://www.googleapis.com/auth/adwords', // Google Ads
    ].join(' ')

    const params = new URLSearchParams({
      client_id: clientIdSecret,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'select_account consent', // always show account picker + re-consent (refresh token)
      include_granted_scopes: 'true',
      state: encodeURIComponent(clientId), // pass clientId as state for security
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('[OAuth initiate]', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    )
  }
}
