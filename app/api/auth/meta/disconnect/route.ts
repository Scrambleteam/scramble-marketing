import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth'

const GRAPH_API_VERSION = 'v26.0'
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

/**
 * POST /api/auth/meta/disconnect
 *
 * Disconnect a client's Meta OAuth connection and revoke the token with
 * Meta. Requires authentication — users can only disconnect their own
 * connection. Mirrors /api/auth/google/disconnect.
 *
 * Body:
 *   clientId: string
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) return unauthorizedResponse()

    const { clientId } = await request.json()
    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }

    if (clientId.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'Forbidden: can only disconnect your own account' },
        { status: 403 }
      )
    }

    const supabase = createAdminSupabaseClient()

    const { data: connection, error: fetchError } = await supabase
      .from('meta_oauth_connections')
      .select('id, access_token, meta_account_name')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .single()

    if (fetchError || !connection) {
      return NextResponse.json({ error: 'No active connection found' }, { status: 404 })
    }

    await revokeMetaToken(connection.access_token)

    const { error: updateError } = await supabase
      .from('meta_oauth_connections')
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq('id', connection.id)

    if (updateError) {
      console.error('[Meta disconnect] Update failed:', updateError)
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
    }

    await supabase
      .from('scramble_users')
      .update({ meta_connected: false, updated_at: new Date().toISOString() })
      .eq('email', clientId)

    await supabase.from('meta_oauth_audit').insert([
      {
        connection_id: connection.id,
        event_type: 'oauth_revoked',
        details: { name: connection.meta_account_name },
      },
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Meta OAuth disconnect]', error)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}

// Meta's equivalent of Google's /revoke: deleting granted permissions for
// this app on the user's Meta account. Best-effort, same as the Google
// version — a failure here shouldn't block marking the connection inactive
// on our side.
async function revokeMetaToken(accessToken: string) {
  try {
    const params = new URLSearchParams({ access_token: accessToken })
    const res = await fetch(`${GRAPH_BASE}/me/permissions?${params.toString()}`, { method: 'DELETE' })
    if (!res.ok) {
      console.warn(`Meta permission revocation may have failed: ${res.statusText}`)
    }
  } catch (error) {
    console.error('[Meta token revocation]', error)
  }
}
