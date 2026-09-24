"use client";

import { createClient } from "@supabase/supabase-js";

// Browser-side Supabase client for auth (email/password + session).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const authClient = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
