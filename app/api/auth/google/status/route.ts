import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, unauthorizedResponse } from '@/lib/api-auth'
import { AGENCY_GOOGLE_EMAIL } from '@/lib/admin'
import { getAgencyConnection } from '@/lib/google-agency'

/**
 * GET /api/auth/google/status
 *
 * Admin only. Reports whether the agency Google account is connected and
 * whether the Google Ads API settings are in place.
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request)
  if (!admin) return unauthorizedResponse('Admin access required')

  try {
    const connection = await getAgencyConnection()
    return NextResponse.json({
      agencyEmail: AGENCY_GOOGLE_EMAIL,
      connected: !!connection,
      email: connection?.google_account_email ?? null,
      connectedBy: connection?.connected_by_email ?? null,
      updatedAt: connection?.updated_at ?? null,
      scopes: connection?.granted_scopes.split(' ').filter(Boolean) ?? [],
      ads: {
        developerToken: !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
        managerAccount: !!process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      },
    })
  } catch (error) {
    console.error('[OAuth status]', error)
    return NextResponse.json({ error: 'Failed to check Google connection' }, { status: 500 })
  }
}
