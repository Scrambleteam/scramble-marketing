import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-side auth helper for API routes.
 *
 * Validates the Supabase session from the request cookies/headers.
 * Returns the authenticated user or null.
 */
export async function getAuthenticatedUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      // Try to get token from cookies (Supabase auth stores session in cookies)
      const cookies = request.cookies;
      // Supabase stores session as sb-<project-ref>-auth-token
      const sbCookie = cookies.get('sb-nozbcpzdkivpyfxcvrah-auth-token')?.value
      const accessToken =
        sbCookie ? JSON.parse(decodeURIComponent(sbCookie))?.access_token : null ||
        cookies.get('sb-access-token')?.value ||
        cookies.get('scramble-auth-token')?.value
      if (!accessToken) return null;
      return await verifyToken(accessToken);
    }

    return await verifyToken(token);
  } catch {
    return null;
  }
}

async function verifyToken(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

/**
 * Return a 401 JSON response.
 */
export function unauthorizedResponse(message = "Authentication required") {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Return a 403 JSON response.
 */
export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}
