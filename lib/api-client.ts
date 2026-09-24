"use client";

import { authClient } from "./auth-client";

/**
 * Fetch wrapper for calling our own /api/* routes that require a signed-in
 * user (anything using getAuthenticatedUser() in lib/api-auth.ts).
 *
 * Supabase sessions here are stored in the BROWSER (localStorage, key
 * "scramble-auth" — see auth-client.ts), not in a cookie. A plain fetch()
 * from a client component therefore carries no proof of who's signed in,
 * so the server always sees these requests as unauthenticated and returns
 * 401 — even though the user is genuinely logged in and their data exists.
 *
 * This was the root cause of new clients appearing to "not exist" right
 * after signup: every authenticated page (dashboard, onboarding, settings,
 * the admin client list) called plain fetch() against /api/scramble/me,
 * /api/auth/google/status, etc., always got 401, and silently rendered
 * "No profile found" / an empty list instead of the real data.
 *
 * Fix: attach the current session's access token as a Bearer header so
 * the server can verify it. Always use this (never a bare fetch()) for
 * any call to a route gated by getAuthenticatedUser().
 */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await authClient.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
}

/**
 * Same as authFetch, but throws a descriptive Error on any non-2xx response
 * (using the server's { error } body when present) instead of returning a
 * Response the caller might forget to check. Use this for actions where
 * silently swallowing a failure would be actively harmful — e.g. marking
 * onboarding complete, saving billing state.
 */
export async function authFetchOrThrow(input: string, init: RequestInit = {}): Promise<Response> {
  const res = await authFetch(input, init);
  if (!res.ok) {
    let message = `Request to ${input} failed (${res.status})`;
    try {
      const body = await res.clone().json();
      if (body?.error) message = body.error;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    throw new Error(message);
  }
  return res;
}
