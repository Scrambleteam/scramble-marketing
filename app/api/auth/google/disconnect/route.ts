import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth'

/**
 * POST /api/auth/google/disconnect
 * 
 * Disconnect a client's Google OAuth connection and revoke tokens.
 * Requires authentication — users can only disconnect their own connection.
 * 
 * Body:
 *   clientId: string
 */
export async function POST(request: NextRequest) {
  try {
    // Auth gate
    const user = await getAuthenticatedUser(request)
    if (!user) return unauthorizedResponse()

    const { clientId } = await request.json()

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      )
    }

    // Users can only disconnect their own Google connection
    if (clientId.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'Forbidden: can only disconnect your own account' },
        { status: 403 }
      )
    }

    const supabase = createAdminSupabaseClient()

    // Get the connection to extract access token for revocation
    const { data: connection, error: fetchError } = await supabase
      .from('google_oauth_connections')
      .select('id, access_token, google_account_email')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .single()

    if (fetchError || !connection) {
      return NextResponse.json(
        { error: 'No active connection found' },
        { status: 404 }
      )
    }

    // Revoke the token with Google
    await revokeGoogleToken(connection.access_token)

    // Mark as revoked in Supabase
    const { error: updateError } = await supabase
      .from('google_oauth_connections')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
      })
      .eq('id', connection.id)

    if (updateError) {
      console.error('[Disconnect] Update failed:', updateError)
      return NextResponse.json(
        { error: 'Failed to disconnect' },
        { status: 500 }
      )
    }

    // Log audit event
    await logAuditEvent(supabase, connection.id, 'oauth_revoked', {
      email: connection.google_account_email,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[OAuth disconnect]', error)
    return NextResponse.json(
      { error: 'Failed to disconnect' },
      { status: 500 }
    )
  }
}

/**
 * Revoke token with Google
 */
async function revokeGoogleToken(accessToken: string) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: accessToken }).toString(),
    })

    if (!response.ok) {
      console.warn(`Token revocation may have failed: ${response.statusText}`)
    }
  } catch (error) {
    console.error('[Token revocation]', error)
  }
}

/**
 * Log audit event
 */
async function logAuditEvent(supabase: any, connectionId: string, eventType: string, details: any) {
  try {
    await supabase.from('google_oauth_audit').insert([
      {
        connection_id: connectionId,
        event_type: eventType,
        details,
      },
    ])
  } catch (error) {
    console.error('[Audit log]', error)
  }
}
