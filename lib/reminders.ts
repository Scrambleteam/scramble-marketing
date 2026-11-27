/**
 * Server-only: the team's scheduled phone reminders.
 *
 * Supabase (pg_cron) calls /api/cron/team-reminders every 5 minutes. This file
 * works out, in London time, whether a reminder is due, and what it says.
 * Text is generic on purpose: counts only, no client names on a lock screen.
 */

import { createAdminSupabaseClient } from "./supabase";
import { PushMessage, TeamMemberName } from "./push";

export interface Slot {
  key: "sunday-am" | "sunday-pm" | "daily";
  /** 0 = Sunday ... 6 = Saturday, in London time */
  days: number[];
  hour: number;
  minute: number;
}

export const SLOTS: Slot[] = [
  { key: "sunday-am", days: [0], hour: 10, minute: 0 },
  { key: "sunday-pm", days: [0], hour: 18, minute: 0 },
  { key: "daily", days: [1, 2, 3, 4, 5], hour: 8, minute: 0 },
];

/** A reminder stays due for this long after its time, so a late or missed check still sends it */
export const WINDOW_MINUTES = 30;

const URL = "/admin/app";

export function londonNow(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    dow,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** Reminders that are due right now (London time) */
export function dueSlots(now = londonNow()): Slot[] {
  return SLOTS.filter((s) => {
    const start = s.hour * 60 + s.minute;
    return s.days.includes(now.dow) && now.minutes >= start && now.minutes < start + WINDOW_MINUTES;
  });
}

export function sundayMessage(slot: "sunday-am" | "sunday-pm"): PushMessage {
  return slot === "sunday-am"
    ? { title: "Plan your week", body: "Update your availability and add this week’s tasks.", url: URL, tag: "sunday-am" }
    : { title: "Still to plan?", body: "Check your week is planned before tomorrow.", url: URL, tag: "sunday-pm" };
}

/** Today's summary for one person: their tasks plus unassigned ones */
export async function dailyMessage(member: TeamMemberName, today: string): Promise<PushMessage> {
  const { data } = await createAdminSupabaseClient()
    .from("team_tasks")
    .select("due_date, owner")
    .eq("done", false)
    .lte("due_date", today)
    .or(`owner.eq.${member},owner.is.null`)
    .limit(500);

  const rows = data ?? [];
  const dueToday = rows.filter((r) => r.due_date === today).length;
  const overdue = rows.length - dueToday;
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

  let body: string;
  if (dueToday === 0 && overdue === 0) body = "Nothing planned for today. Add something, or enjoy the quiet.";
  else if (dueToday === 0) body = `Nothing due today, but ${overdue} overdue.`;
  else body = `You have ${plural(dueToday, "task")} today${overdue ? `, plus ${overdue} overdue` : ""}.`;

  return { title: "Today", body, url: URL, tag: "daily" };
}
