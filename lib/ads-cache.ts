/**
 * Server-only: a small Supabase-backed cache for Google Ads responses.
 *
 * Google Ads is rate limited (and, through Maton, shared), so each result is
 * fetched at most once per `maxAgeMs`. If a refresh fails and an older copy
 * exists, the older copy is returned instead of an error. If the cache table
 * isn't available, calls fall straight through to Google as before.
 */

import { createAdminSupabaseClient } from "./supabase";

export const DAY_MS = 24 * 60 * 60 * 1000;

export async function cachedAds<T>(key: string, maxAgeMs: number, fetcher: () => Promise<T>): Promise<T> {
  let cached: { data: T; fetchedAt: number } | null = null;
  try {
    const { data } = await createAdminSupabaseClient()
      .from("ads_cache")
      .select("data, fetched_at")
      .eq("cache_key", key)
      .maybeSingle();
    if (data) cached = { data: data.data as T, fetchedAt: new Date(data.fetched_at).getTime() };
  } catch {
    // Cache unavailable: carry on without it
  }

  if (cached && Date.now() - cached.fetchedAt < maxAgeMs) return cached.data;

  try {
    const fresh = await fetcher();
    try {
      await createAdminSupabaseClient()
        .from("ads_cache")
        .upsert({ cache_key: key, data: fresh as unknown as object, fetched_at: new Date().toISOString() });
    } catch {
      // Not being able to save is not worth failing the request
    }
    return fresh;
  } catch (err) {
    if (cached) {
      console.warn("[ads cache] refresh failed, serving the last saved copy for", key);
      return cached.data;
    }
    throw err;
  }
}
