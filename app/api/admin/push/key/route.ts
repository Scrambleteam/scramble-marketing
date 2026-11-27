import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse } from "@/lib/api-auth";
import { pushConfigured, vapidPublicKey } from "@/lib/push";

/** GET /api/admin/push/key: the public key a phone needs to subscribe. Admin only. */
export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");
  return NextResponse.json({ configured: pushConfigured(), publicKey: pushConfigured() ? vapidPublicKey() : null });
}
