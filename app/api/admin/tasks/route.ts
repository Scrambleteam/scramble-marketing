import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getAdminUser, unauthorizedResponse } from "@/lib/api-auth";
import { TEAM_MEMBERS } from "@/lib/workspace";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f-]{36}$/i;
const COLUMNS =
  "id, title, owner, due_date, scramble_user_id, source, source_id, done, done_at, done_by, created_by, scramble_users(company_name)";

/**
 * GET /api/admin/tasks?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Admin only. INTERNAL. Returns tasks due in the range, plus anything still
 * open that is overdue (before `from`) or has no date.
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");

  const params = new URL(request.url).searchParams;
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) return NextResponse.json({ error: "from and to are required (YYYY-MM-DD)" }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("team_tasks")
    .select(COLUMNS)
    .or(`and(due_date.gte.${from},due_date.lte.${to}),and(done.eq.false,due_date.lt.${from}),and(done.eq.false,due_date.is.null)`)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) {
    console.error("[admin tasks GET]", error);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
  return NextResponse.json({ tasks: data ?? [] });
}

/**
 * POST /api/admin/tasks
 * Admin only. Body: { by, title, owner?, due_date?, scramble_user_id?, source?, source_id? }
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return unauthorizedResponse("Admin access required");

  const body = await request.json().catch(() => null);
  if (!TEAM_MEMBERS.includes(body?.by)) return NextResponse.json({ error: "Choose who you are" }, { status: 400 });
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title || title.length > 200) return NextResponse.json({ error: "Give the task a title (200 characters or fewer)" }, { status: 400 });
  if (body.owner != null && !TEAM_MEMBERS.includes(body.owner)) return NextResponse.json({ error: "Unknown owner" }, { status: 400 });
  if (body.due_date != null && !DATE_RE.test(body.due_date)) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  if (body.scramble_user_id != null && !UUID_RE.test(body.scramble_user_id)) return NextResponse.json({ error: "Invalid client" }, { status: 400 });
  const source = body.source === "suggestion" ? "suggestion" : "manual";
  if (body.source_id != null && !UUID_RE.test(body.source_id)) return NextResponse.json({ error: "Invalid source" }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("team_tasks")
    .insert({
      title,
      owner: body.owner ?? null,
      due_date: body.due_date ?? null,
      scramble_user_id: body.scramble_user_id ?? null,
      source,
      source_id: body.source_id ?? null,
      created_by: body.by,
    })
    .select(COLUMNS)
    .single();
  if (error) {
    console.error("[admin tasks POST]", error);
    return NextResponse.json({ error: "Couldn't add the task" }, { status: 500 });
  }
  return NextResponse.json({ task: data });
}
