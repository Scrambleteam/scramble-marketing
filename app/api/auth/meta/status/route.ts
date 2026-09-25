import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth'

/**
 * GET /api/auth/meta/status?clientId=...
 *
 * Check if a client has connected their Meta account and what scopes are
 * granted. Requires authentication — users can only check their own status.
 * Mirrors /api/auth/google/status.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }

    if (clientId.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'Forbidden: can only check your own status' },
        { status: 403 }
      )
    }

    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from('meta_oauth_connections')
      .select('id, meta_account_name, granted_scopes, is_active, token_expires_at, last_used_at')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return NextResponse.json({ connected: false, name: null, scopes: [] })
    }

    const scopes = data.granted_scopes.split(' ').filter(Boolean)
    // No refresh grant for Meta user tokens — once expired (~60 days), the
    // client must reconnect. See 004_meta_oauth.sql.
    const isExpired = data.token_expires_at ? new Date(data.token_expires_at) < new Date() : false

    return NextResponse.json({
      connected: !isExpired,
      expired: isExpired,
      name: data.meta_account_name,
      scopes,
      lastUsed: data.last_used_at,
      expiresAt: data.token_expires_at,
      hasScopes: {
        adsManagement: scopes.includes('ads_management'),
        adsRead: scopes.includes('ads_read'),
      },
    })
  } catch (error) {
    console.error('[Meta OAuth status]', error)
    return NextResponse.json({ error: 'Failed to check Meta OAuth status' }, { status: 500 })
  }
}
