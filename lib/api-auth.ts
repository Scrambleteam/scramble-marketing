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
      // Supabase default cookie is sb-<project-ref>-auth-token
      // Custom storageKey 'scramble-auth' uses sb-scramble-auth-auth-token
      let sbToken: string | null = null
      for (const cookieName of [
        'sb-nozbcpzdkivpyfxcvrah-auth-token',
        'sb-scramble-auth-auth-token',
        'scramble-auth',
        'sb-access-token'
      ]) {
        const raw = cookies.get(cookieName)?.value
        if (raw) {
          try {
            const parsed = JSON.parse(decodeURIComponent(raw))
            sbToken = parsed?.access_token || parsed
            if (sbToken) break
          } catch {
            sbToken = raw
            break
          }
        }
      }
      const accessToken = sbToken
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
