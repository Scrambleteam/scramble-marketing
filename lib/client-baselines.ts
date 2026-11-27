/**
 * Server-only: baselines for the dashboard's headline measures.
 * The first time a measure can be measured for a client, its value is saved
 * as their starting point.
 */

import { createAdminSupabaseClient } from "./supabase";

export interface BaselineInput {
  key: string;
  value: number;
  period: { start: string; end: string };
}

export interface Baseline {
  value: number;
  capturedAt: string;
}

/** Returns the saved baseline for each key, saving one now for any that has none yet */
export async function syncBaselines(clientId: string, items: BaselineInput[]): Promise<Record<string, Baseline>> {
  const out: Record<string, Baseline> = {};
  if (items.length === 0) return out;
  try {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from("client_baselines")
      .select("measure_key, value, captured_at")
      .eq("scramble_user_id", clientId);
    for (const r of data ?? []) out[r.measure_key] = { value: Number(r.value), capturedAt: r.captured_at };

    const missing = items.filter((i) => !(i.key in out));
    if (missing.length) {
      const now = new Date().toISOString();
      await supabase.from("client_baselines").upsert(
        missing.map((m) => ({
          scramble_user_id: clientId,
          measure_key: m.key,
          value: m.value,
          period_start: m.period.start,
          period_end: m.period.end,
          captured_at: now,
        })),
        { onConflict: "scramble_user_id,measure_key", ignoreDuplicates: true }
      );
      for (const m of missing) out[m.key] = { value: m.value, capturedAt: now };
    }
  } catch (err) {
    // No baseline is better than a broken dashboard
    console.error("[baselines]", err);
  }
  return out;
}
