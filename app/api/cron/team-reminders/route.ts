import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { TEAM_MEMBERS } from "@/lib/workspace";
import { pushConfigured, sendToMember } from "@/lib/push";
import { dailyMessage, dueSlots, londonNow, sundayMessage } from "@/lib/reminders";

/**
 * POST /api/cron/team-reminders
 *
 * Called by Supabase (pg_cron) every 5 minutes. Sends any reminder that is due
 * in London time, once only: each (slot, date) is claimed in reminder_log
 * before sending, so repeated calls do nothing. It needs no secret because it
 * can only send the normal reminders, at the right time, once each.
 */
async function run() {
  if (!pushConfigured()) return NextResponse.json({ status: "skipped", reason: "push not configured" });

  const now = londonNow();
  const due = dueSlots(now);
  if (due.length === 0) return NextResponse.json({ status: "ok", due: [] });

  const supabase = createAdminSupabaseClient();
  const results: Record<string, unknown> = {};

  for (const slot of due) {
    const { error: claimError } = await supabase.from("reminder_log").insert({ slot: slot.key, run_date: now.date });
    if (claimError) {
      results[slot.key] = claimError.code === "23505" ? "already sent" : "couldn't record, skipped";
      continue;
    }

    let sent = 0;
    let failed = 0;
    for (const member of TEAM_MEMBERS) {
      const message = slot.key === "daily" ? await dailyMessage(member, now.date) : sundayMessage(slot.key);
      try {
        const r = await sendToMember(member, message);
        sent += r.sent;
        failed += r.failed;
      } catch (err) {
        failed++;
        console.error("[team reminders]", err);
      }
    }

    // If nothing got through at all, release the claim so the next check can retry within the window
    if (sent === 0 && failed > 0) await supabase.from("reminder_log").delete().eq("slot", slot.key).eq("run_date", now.date);
    else await supabase.from("reminder_log").update({ recipients: sent }).eq("slot", slot.key).eq("run_date", now.date);
    results[slot.key] = { sent, failed };
  }

  return NextResponse.json({ status: "ok", results });
}

export const POST = run;
export const GET = run;
