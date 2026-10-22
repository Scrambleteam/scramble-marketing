import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { getAdminUser, unauthorizedResponse } from '@/lib/api-auth'

/**
 * POST /api/auth/google/disconnect
 *
 * Admin only. Revokes the agency Google token at Google and removes the
 * agency connection. Every client dashboard stops showing Google data until
 * an admin reconnects.
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request)
  if (!admin) return unauthorizedResponse('Admin access required')

  try {
    const supabase = createAdminSupabaseClient()
    const { data: row } = await supabase
      .from('agency_google_connection')
      .select('refresh_token')
      .eq('provider', 'google')
      .maybeSingle()

    if (row?.refresh_token) {
      // Revoking the refresh token also invalidates its access tokens
      await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: row.refresh_token }).toString(),
      }).catch((err) => console.error('[OAuth disconnect] revoke failed', err))
    }

    const { error } = await supabase.from('agency_google_connection').delete().eq('provider', 'google')
    if (error) {
      console.error('[OAuth disconnect]', error)
      return NextResponse.json({ error: 'Failed to remove connection' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[OAuth disconnect]', error)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
