import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { metaBusinessId } from "@/lib/meta-agency";

/**
 * GET /api/meta/partner-info
 *
 * Signed-in users only. Returns Scramble's Meta Business ID, which clients
 * enter in Business Settings -> Partners to share their ad account with us.
 * It is an identifier, not a secret; no token is ever returned.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user?.email) return unauthorizedResponse();
  return NextResponse.json({ businessId: metaBusinessId() });
}
