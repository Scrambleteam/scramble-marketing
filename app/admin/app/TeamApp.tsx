"use client";

// INTERNAL: Scramble's team mobile app. Admin only. Nothing here is shown to clients.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { authFetch } from "@/lib/api-client";
import { isAdminEmail } from "@/lib/admin";
import { SCRAMBLE_THEME } from "@/lib/scramble-theme";
import { SEO_KINDS, SeoKind } from "@/lib/seo-analysis";
import { TEAM_MEMBERS } from "@/lib/workspace";
import TeamMemberPicker, { TeamMember, useTeamMember } from "@/components/admin/TeamMemberPicker";

interface Task {
  id: string;
  title: string;
  owner: string | null;
  due_date: string | null;
  scramble_user_id: string | null;
  source: "manual" | "suggestion";
  done: boolean;
  scramble_users: { company_name: string } | { company_name: string }[] | null;
}
interface Suggestion {
  id: string;
  scramble_user_id: string;
  kind: SeoKind;
  summary: string;
  recommendation: string;
  status: string;
  scramble_users: { company_name: string } | { company_name: string }[] | null;
}
interface ClientLite {
  id: string;
  company_name: string;
}
type Tab = "today" | "week" | "inbox" | "more";
type Scope = "mine" | "all";

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const mondayOf = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));
const nameOf = (c: { company_name: string } | { company_name: string }[] | null) =>
  (Array.isArray(c) ? c[0] : c)?.company_name || "";
const dayName = (d: Date, style: "short" | "long" = "short") =>
  d.toLocaleDateString("en-GB", { weekday: style });

export default function TeamApp() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    authClient.auth.getUser().then(({ data }) => {
      if (isAdminEmail(data.user?.email)) setAuthorized(true);
      else router.replace("/admin-login");
    });
  }, [router]);

  return (
    <div className="ta-root">
      <style>{SCRAMBLE_THEME}</style>
      <style>{appStyles}</style>
      {authorized ? (
        <App />
      ) : (
        <div className="ta-center">
          <p>Checking access…</p>
        </div>
      )}
    </div>
  );
}

function App() {
  const router = useRouter();
  const { member, setMember } = useTeamMember();
  const [tab, setTab] = useState<Tab>("today");
  const [scope, setScope] = useState<Scope>("mine");
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState<{ task?: Task; due?: string } | null>(null);

  const today = useMemo(() => ymd(new Date()), []);
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [selectedDay, setSelectedDay] = useState(today);

  const loadTasks = useCallback(async () => {
    // Cover this week, the viewed week, and today, so every tab has its data
    const first = [mondayOf(new Date()), weekStart].sort((a, b) => a.getTime() - b.getTime())[0];
    const last = addDays([mondayOf(new Date()), weekStart].sort((a, b) => b.getTime() - a.getTime())[0], 6);
    try {
      const res = await authFetch(`/api/admin/tasks?from=${ymd(first)}&to=${ymd(last)}`);
      if (!res.ok) throw new Error();
      setTasks((await res.json()).tasks);
      setLoadError(false);
    } catch {
      setLoadError(true);
      setTasks((t) => t ?? []);
    }
  }, [weekStart]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load data on mount / week change
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    authFetch("/api/admin/clients-lite")
      .then((r) => (r.ok ? r.json() : { clients: [] }))
      .then((d) => setClients(d.clients))
      .catch(() => {});
  }, []);

  const needMember = (): TeamMember | null => {
    if (member) return member;
    setError("Choose who you are first.");
    setTab("more");
    return null;
  };

  const mine = (t: Task) => scope === "all" || !t.owner || t.owner === member;
  const visibleTasks = (tasks || []).filter(mine);

  const toggle = async (t: Task) => {
    const by = needMember();
    if (!by) return;
    setError("");
    setTasks((list) => (list || []).map((x) => (x.id === t.id ? { ...x, done: !t.done } : x)));
    const res = await authFetch(`/api/admin/tasks/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !t.done, by }),
    });
    if (!res.ok) {
      setError("Couldn't save that. Try again.");
      loadTasks();
    }
  };

  const save = async (input: { id?: string; title: string; owner: string | null; due_date: string | null; scramble_user_id: string | null }) => {
    const by = needMember();
    if (!by) return false;
    const res = await authFetch(input.id ? `/api/admin/tasks/${input.id}` : "/api/admin/tasks", {
      method: input.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        input.id
          ? { title: input.title, owner: input.owner, due_date: input.due_date, by }
          : { title: input.title, owner: input.owner, due_date: input.due_date, scramble_user_id: input.scramble_user_id, by }
      ),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Couldn't save.");
      return false;
    }
    await loadTasks();
    return true;
  };

  const remove = async (id: string) => {
    const by = needMember();
    if (!by) return;
    const res = await authFetch(`/api/admin/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) return setError("Couldn't delete.");
    setTasks((list) => (list || []).filter((x) => x.id !== id));
  };

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  })();

  return (
    <>
      <header className="ta-header">
        <div>
          <p className="ta-hello">{greeting}{member ? `, ${member}` : ""}</p>
          <p className="ta-date">{parse(today).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <div className="ta-scope" role="group" aria-label="Whose tasks">
          <button className={scope === "mine" ? "on" : ""} onClick={() => setScope("mine")}>Mine</button>
          <button className={scope === "all" ? "on" : ""} onClick={() => setScope("all")}>Everyone</button>
        </div>
      </header>

      <main className="ta-main">
        {!member && tab !== "more" && (
          <section className="ta-card">
            <h2 className="ta-card-title">Who are you?</h2>
            <p className="ta-note">Choose your name so your tasks and notifications are yours. You can change it later in Settings.</p>
            <TeamMemberPicker member={member} onChange={setMember} />
          </section>
        )}
        {error && (
          <div className="ta-error" onClick={() => setError("")}>{error}</div>
        )}
        {loadError && <div className="ta-error">Couldn&apos;t load tasks. Pull down to refresh or check your connection.</div>}

        {tab === "today" && (
          <TodayView tasks={visibleTasks} loading={tasks === null} today={today} onToggle={toggle} onEdit={(t) => setSheet({ task: t })} />
        )}
        {tab === "week" && (
          <WeekView
            tasks={visibleTasks}
            weekStart={weekStart}
            selected={selectedDay}
            today={today}
            onSelect={setSelectedDay}
            onWeek={(d) => {
              setWeekStart(d);
              setSelectedDay(ymd(d));
            }}
            onToggle={toggle}
            onEdit={(t) => setSheet({ task: t })}
          />
        )}
        {tab === "inbox" && (
          <InboxView
            member={member}
            needMember={needMember}
            today={today}
            onError={setError}
            onTaskAdded={loadTasks}
          />
        )}
        {tab === "more" && (
          <MoreView member={member} setMember={setMember} onSignOut={async () => {
            await authClient.auth.signOut();
            router.push("/admin-login");
          }} />
        )}
      </main>

      {(tab === "today" || tab === "week") && (
        <button className="ta-fab" aria-label="Add a task" onClick={() => setSheet({ due: tab === "week" ? selectedDay : today })}>+</button>
      )}

      <nav className="ta-tabs" aria-label="Sections">
        {(
          [
            ["today", "Today", "☀︎"],
            ["week", "Week", "▦"],
            ["inbox", "Inbox", "✦"],
            ["more", "Settings", "⚙︎"],
          ] as [Tab, string, string][]
        ).map(([key, label, icon]) => (
          <button key={key} className={tab === key ? "on" : ""} onClick={() => setTab(key)} aria-current={tab === key}>
            <span className="ta-tab-icon">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {sheet && (
        <TaskSheet
          task={sheet.task}
          defaultDue={sheet.due ?? null}
          defaultOwner={member}
          clients={clients}
          onClose={() => setSheet(null)}
          onSave={async (v) => {
            if (await save({ ...v, id: sheet.task?.id })) setSheet(null);
          }}
          onDelete={sheet.task ? async () => {
            await remove(sheet.task!.id);
            setSheet(null);
          } : undefined}
        />
      )}
    </>
  );
}

// ─── Today ──────────────────────────────────────────────────────────────────

function dueLabel(due: string | null, today: string) {
  if (!due) return "No date";
  if (due === today) return "Today";
  if (due === ymd(addDays(parse(today), 1))) return "Tomorrow";
  if (due === ymd(addDays(parse(today), -1))) return "Yesterday";
  return parse(due).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function TaskRow({ t, today, onToggle, onEdit, showDue = true }: { t: Task; today: string; onToggle: (t: Task) => void; onEdit: (t: Task) => void; showDue?: boolean }) {
  const client = nameOf(t.scramble_users);
  const overdue = !t.done && t.due_date && t.due_date < today;
  return (
    <li className={`ta-task ${t.done ? "done" : ""}`}>
      <button className="ta-check" aria-label={t.done ? "Mark not done" : "Mark done"} aria-pressed={t.done} onClick={() => onToggle(t)}>
        {t.done ? "✓" : ""}
      </button>
      <button className="ta-task-body" onClick={() => onEdit(t)}>
        <span className="ta-task-title">{t.title}</span>
        <span className="ta-chips">
          {client && <span className="ta-chip client">{client}</span>}
          {t.owner && <span className="ta-chip owner">{t.owner}</span>}
          {showDue && t.due_date && <span className={`ta-chip ${overdue ? "late" : ""}`}>{dueLabel(t.due_date, today)}</span>}
          {t.source === "suggestion" && <span className="ta-chip">From inbox</span>}
        </span>
      </button>
    </li>
  );
}

function TodayView({ tasks, loading, today, onToggle, onEdit }: { tasks: Task[]; loading: boolean; today: string; onToggle: (t: Task) => void; onEdit: (t: Task) => void }) {
  if (loading) return <p className="ta-muted">Loading…</p>;
  const overdue = tasks.filter((t) => !t.done && t.due_date && t.due_date < today);
  const todays = tasks.filter((t) => t.due_date === today);
  const undated = tasks.filter((t) => !t.due_date && !t.done);
  const doneToday = todays.filter((t) => t.done).length;
  const total = todays.length;
  const pct = total ? Math.round((doneToday / total) * 100) : 0;

  return (
    <>
      <section className="ta-progress">
        <div className="ta-progress-top">
          <strong>{total === 0 ? "Nothing due today" : `${doneToday} of ${total} done`}</strong>
          {total > 0 && <span>{pct}%</span>}
        </div>
        <div className="ta-bar"><div style={{ width: `${pct}%` }} /></div>
      </section>

      {overdue.length > 0 && (
        <Section title="Overdue" count={overdue.length} tone="late">
          {overdue.map((t) => <TaskRow key={t.id} t={t} today={today} onToggle={onToggle} onEdit={onEdit} />)}
        </Section>
      )}
      <Section title="Today" count={todays.filter((t) => !t.done).length}>
        {todays.length === 0 ? <li className="ta-empty">Nothing planned for today. Tap + to add something.</li> : todays.map((t) => <TaskRow key={t.id} t={t} today={today} onToggle={onToggle} onEdit={onEdit} showDue={false} />)}
      </Section>
      {undated.length > 0 && (
        <Section title="No date" count={undated.length}>
          {undated.map((t) => <TaskRow key={t.id} t={t} today={today} onToggle={onToggle} onEdit={onEdit} />)}
        </Section>
      )}
    </>
  );
}

function Section({ title, count, tone, children }: { title: string; count: number; tone?: "late"; children: React.ReactNode }) {
  return (
    <section className="ta-section">
      <h2 className={`ta-section-title ${tone ?? ""}`}>{title}<span>{count}</span></h2>
      <ul className="ta-list">{children}</ul>
    </section>
  );
}

// ─── Week ───────────────────────────────────────────────────────────────────

function WeekView({
  tasks,
  weekStart,
  selected,
  today,
  onSelect,
  onWeek,
  onToggle,
  onEdit,
}: {
  tasks: Task[];
  weekStart: Date;
  selected: string;
  today: string;
  onSelect: (d: string) => void;
  onWeek: (d: Date) => void;
  onToggle: (t: Task) => void;
  onEdit: (t: Task) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayTasks = tasks.filter((t) => t.due_date === selected);
  const label = `${days[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;

  return (
    <>
      <div className="ta-weeknav">
        <button aria-label="Previous week" onClick={() => onWeek(addDays(weekStart, -7))}>‹</button>
        <div>
          <strong>{label}</strong>
          {ymd(weekStart) !== ymd(mondayOf(new Date())) && (
            <button className="ta-link" onClick={() => { onWeek(mondayOf(new Date())); onSelect(today); }}>This week</button>
          )}
        </div>
        <button aria-label="Next week" onClick={() => onWeek(addDays(weekStart, 7))}>›</button>
      </div>

      <div className="ta-strip">
        {days.map((d) => {
          const key = ymd(d);
          const open = tasks.filter((t) => t.due_date === key && !t.done).length;
          const all = tasks.filter((t) => t.due_date === key).length;
          return (
            <button key={key} className={`ta-day ${selected === key ? "sel" : ""} ${today === key ? "today" : ""}`} onClick={() => onSelect(key)} aria-pressed={selected === key}>
              <span className="ta-day-name">{dayName(d).slice(0, 3)}</span>
              <span className="ta-day-num">{d.getDate()}</span>
              <span className="ta-day-dot">{all > 0 ? (open > 0 ? open : "✓") : ""}</span>
            </button>
          );
        })}
      </div>

      <Section title={parse(selected).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} count={dayTasks.filter((t) => !t.done).length}>
        {dayTasks.length === 0 ? <li className="ta-empty">Nothing planned. Tap + to add something.</li> : dayTasks.map((t) => <TaskRow key={t.id} t={t} today={today} onToggle={onToggle} onEdit={onEdit} showDue={false} />)}
      </Section>
    </>
  );
}

// ─── Inbox ──────────────────────────────────────────────────────────────────

function InboxView({
  member,
  needMember,
  today,
  onError,
  onTaskAdded,
}: {
  member: TeamMember | null;
  needMember: () => TeamMember | null;
  today: string;
  onError: (m: string) => void;
  onTaskAdded: () => void;
}) {
  const [items, setItems] = useState<Suggestion[] | null>(null);

  useEffect(() => {
    authFetch("/api/admin/inbox")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setItems((d.suggestions as Suggestion[]).filter((s) => s.status === "new")))
      .catch(() => {
        onError("Couldn't load the inbox.");
        setItems([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (s: Suggestion, action: "accept" | "dismiss") => {
    const by = needMember();
    if (!by) return;
    const res = await authFetch(`/api/admin/seo/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: action === "accept" ? "accepted" : "dismissed", ...(action === "accept" ? { owner: by } : {}), by }),
    });
    if (!res.ok) return onError("Couldn't update that suggestion.");
    if (action === "accept") {
      const title = `${nameOf(s.scramble_users) || "Client"}: ${s.recommendation}`.slice(0, 200);
      const t = await authFetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, owner: by, due_date: today, scramble_user_id: s.scramble_user_id, source: "suggestion", source_id: s.id, by }),
      });
      if (!t.ok) onError("Accepted, but couldn't add it to your tasks.");
      else onTaskAdded();
    }
    setItems((list) => (list || []).filter((x) => x.id !== s.id));
  };

  if (items === null) return <p className="ta-muted">Loading…</p>;
  return (
    <>
      <p className="ta-note">Ideas from the SEO worker, for the team only. Accepting one adds it to {member ? `${member}’s` : "your"} tasks for today.</p>
      {items.length === 0 ? (
        <p className="ta-empty-block">Nothing waiting for review.</p>
      ) : (
        <ul className="ta-list">
          {items.map((s) => (
            <li key={s.id} className="ta-card">
              <div className="ta-chips">
                <span className="ta-chip client">{nameOf(s.scramble_users) || "Client"}</span>
                <span className="ta-chip kind">{SEO_KINDS[s.kind]?.label ?? s.kind}</span>
              </div>
              <p className="ta-card-summary">{s.summary}</p>
              <p className="ta-card-rec"><strong>Suggested:</strong> {s.recommendation}</p>
              <div className="ta-card-actions">
                <button className="ta-btn primary" onClick={() => act(s, "accept")}>Accept</button>
                <button className="ta-btn" onClick={() => act(s, "dismiss")}>Dismiss</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// ─── More ───────────────────────────────────────────────────────────────────

function MoreView({ member, setMember, onSignOut }: { member: TeamMember | null; setMember: (m: TeamMember) => void; onSignOut: () => void }) {
  const [standalone] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  });
  return (
    <>
      <section className="ta-card">
        <h2 className="ta-card-title">Who are you?</h2>
        <p className="ta-note">
          {member ? `You’re set as ${member}.` : "Choose your name."} We share one login, so this decides whose tasks
          and notifications you see. It’s remembered on this phone, and you can switch any time.
        </p>
        <TeamMemberPicker member={member} onChange={setMember} />
      </section>

      <section className="ta-card">
        <h2 className="ta-card-title">Add to your home screen</h2>
        {standalone ? (
          <p className="ta-note">✓ You’re using the installed app.</p>
        ) : (
          <ol className="ta-steps">
            <li><strong>iPhone:</strong> tap the Share button in Safari, then <strong>Add to Home Screen</strong>.</li>
            <li><strong>Android:</strong> open the browser menu (⋮), then <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
            <li>Open it from the new Scramble icon.</li>
          </ol>
        )}
      </section>

      <NotificationsCard member={member} />

      <section className="ta-card">
        <Link href="/admin" className="ta-row-link">Open the full admin site →</Link>
        <button className="ta-row-link out" onClick={onSignOut}>Sign out</button>
      </section>
    </>
  );
}

// ─── Notifications ──────────────────────────────────────────────────────────

type PushState = "loading" | "unsupported" | "needs-install" | "not-configured" | "off" | "on" | "denied";

function urlBase64ToBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function NotificationsCard({ member }: { member: TeamMember | null }) {
  const [state, setState] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const ua = navigator.userAgent;
      const isIos = /iPad|iPhone|iPod/.test(ua);
      const installed =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        return setState(isIos && !installed ? "needs-install" : "unsupported");
      }
      const keyRes = await authFetch("/api/admin/push/key").catch(() => null);
      const key = keyRes?.ok ? await keyRes.json() : null;
      if (!key?.configured) return setState("not-configured");
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.getRegistration("/admin/app");
      const sub = await reg?.pushManager.getSubscription();
      setState(sub && Notification.permission === "granted" ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);

  const turnOn = async () => {
    if (!member) return setMessage("Choose who you are in the box above first.");
    setBusy(true);
    setMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const keyRes = await authFetch("/api/admin/push/key");
      const { publicKey } = await keyRes.json();
      const reg = await navigator.serviceWorker.register("/team-sw.js", { scope: "/admin/app" });
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToBytes(publicKey) as BufferSource }));
      const res = await authFetch("/api/admin/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ by: member, subscription: sub.toJSON() }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Couldn’t save");
      setState("on");
      setMessage("Notifications are on. Press “Send me a test” to check.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Couldn’t turn on notifications.");
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    setMessage("");
    try {
      const reg = await navigator.serviceWorker.getRegistration("/admin/app");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await authFetch("/api/admin/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setMessage("Couldn’t turn off notifications.");
    } finally {
      setBusy(false);
    }
  };

  const sendPreview = async (slot: "daily" | "sunday-am") => {
    if (!member) return setMessage("Choose who you are in the box above first.");
    setBusy(true);
    setMessage("");
    const res = await authFetch("/api/admin/push/reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ by: member, slot }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setMessage(res.ok ? "Sent. It should arrive in a few seconds." : data.error || "Couldn’t send.");
  };

  const sendTest = async () => {
    if (!member) return setMessage("Choose who you are in the box above first.");
    setBusy(true);
    setMessage("");
    const res = await authFetch("/api/admin/push/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ by: member }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setMessage(res.ok ? "Sent. It should arrive in a few seconds." : data.error || "Couldn’t send the test.");
  };

  return (
    <section className="ta-card">
      <h2 className="ta-card-title">Notifications</h2>
      {state === "loading" && <p className="ta-note">Checking…</p>}
      {state === "needs-install" && (
        <p className="ta-note">On iPhone, notifications only work from the app on your home screen. Add it first (steps above), open it from the Scramble icon, then come back here.</p>
      )}
      {state === "unsupported" && <p className="ta-note">This browser doesn’t support notifications. Try Safari or Chrome with the app added to your home screen.</p>}
      {state === "not-configured" && <p className="ta-note">Notifications aren’t set up on the server yet. Ask Claude to finish the setup.</p>}
      {state === "denied" && <p className="ta-note">Notifications are blocked for this app. Turn them on in your phone’s Settings, under Notifications, then come back.</p>}
      {state === "off" && (
        <>
          <p className="ta-note">Get reminders on this phone: a Sunday nudge to plan your week, and a daily summary of what’s due.</p>
          <button className="ta-btn primary" onClick={turnOn} disabled={busy}>{busy ? "Turning on…" : "Turn on notifications"}</button>
        </>
      )}
      {state === "on" && (
        <>
          <p className="ta-note">✓ Notifications are on for this phone{member ? ` (${member})` : ""}.</p>
          <div className="ta-card-actions">
            <button className="ta-btn primary" onClick={sendTest} disabled={busy}>Send me a test</button>
            <button className="ta-btn" onClick={turnOff} disabled={busy}>Turn off</button>
          </div>
          <p className="ta-note">Reminders: Sunday 10:00 and 18:00, and every weekday at 08:00. Preview them:</p>
          <div className="ta-card-actions">
            <button className="ta-btn" onClick={() => sendPreview("daily")} disabled={busy}>Today’s summary</button>
            <button className="ta-btn" onClick={() => sendPreview("sunday-am")} disabled={busy}>Sunday plan</button>
          </div>
        </>
      )}
      {message && <p className="ta-note" aria-live="polite">{message}</p>}
    </section>
  );
}

// ─── Add / edit sheet ───────────────────────────────────────────────────────

function TaskSheet({
  task,
  defaultDue,
  defaultOwner,
  clients,
  onClose,
  onSave,
  onDelete,
}: {
  task?: Task;
  defaultDue: string | null;
  defaultOwner: TeamMember | null;
  clients: ClientLite[];
  onClose: () => void;
  onSave: (v: { title: string; owner: string | null; due_date: string | null; scramble_user_id: string | null }) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [owner, setOwner] = useState<string>(task ? task.owner ?? "" : defaultOwner ?? "");
  const [due, setDue] = useState<string>(task ? task.due_date ?? "" : defaultDue ?? "");
  const [client, setClient] = useState<string>(task?.scramble_user_id ?? "");
  const [busy, setBusy] = useState(false);

  return (
    <div className="ta-sheet-backdrop" onClick={onClose}>
      <div className="ta-sheet" role="dialog" aria-label={task ? "Edit task" : "New task"} onClick={(e) => e.stopPropagation()}>
        <div className="ta-sheet-grip" />
        <h2 className="ta-card-title">{task ? "Edit task" : "New task"}</h2>
        <input
          className="ta-input"
          placeholder="What needs doing?"
          value={title}
          maxLength={200}
          autoFocus={!task}
          onChange={(e) => setTitle(e.target.value)}
        />
        <label className="ta-field">
          <span>Due</span>
          <input className="ta-input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </label>
        <label className="ta-field">
          <span>Owner</span>
          <select className="ta-input" value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="">Anyone</option>
            {TEAM_MEMBERS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        {!task && (
          <label className="ta-field">
            <span>Client (optional)</span>
            <select className="ta-input" value={client} onChange={(e) => setClient(e.target.value)}>
              <option value="">None</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </label>
        )}
        <div className="ta-card-actions">
          <button
            className="ta-btn primary"
            disabled={busy || !title.trim()}
            onClick={async () => {
              setBusy(true);
              await onSave({ title: title.trim(), owner: owner || null, due_date: due || null, scramble_user_id: client || null });
              setBusy(false);
            }}
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <button className="ta-btn" onClick={onClose}>Cancel</button>
          {onDelete && (
            <button className="ta-btn danger" onClick={() => { if (confirm("Delete this task?")) onDelete(); }}>Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}

const appStyles = `
  .ta-root {
    min-height: 100dvh; background: #f4f8ff; color: #16243a;
    padding: calc(env(safe-area-inset-top) + 14px) 0 calc(env(safe-area-inset-bottom) + 92px);
    -webkit-tap-highlight-color: transparent;
  }
  .ta-center { min-height: 100dvh; display: flex; align-items: center; justify-content: center; color: #5a6b82; }
  .ta-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; padding: 12px 20px 8px; max-width: 640px; margin: 0 auto; }
  .ta-hello { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
  .ta-date { font-size: 14px; color: #8a97ab; margin: 2px 0 0; }
  .ta-scope { display: flex; background: rgba(45,127,224,0.1); border-radius: 999px; padding: 3px; flex-shrink: 0; }
  .ta-scope button { border: none; background: transparent; padding: 8px 12px; border-radius: 999px; font-family: inherit; font-size: 13px; font-weight: 700; color: #4a5a72; min-height: 36px; }
  .ta-scope button.on { background: #2d7fe0; color: white; }
  .ta-main { max-width: 640px; margin: 0 auto; padding: 8px 20px 0; display: flex; flex-direction: column; gap: 18px; }
  .ta-muted { color: #8a97ab; text-align: center; padding: 40px 0; }
  .ta-error { background: rgba(192,57,43,0.1); color: #a12c1f; border-radius: 12px; padding: 12px 14px; font-size: 14px; font-weight: 600; }
  .ta-note { font-size: 14px; color: #5a6b82; line-height: 1.5; margin: 0 0 4px; }

  .ta-progress { background: linear-gradient(135deg, #4a9eff 0%, #2d7fe0 100%); color: white; border-radius: 20px; padding: 18px 20px; box-shadow: 0 10px 26px rgba(45,127,224,0.28); }
  .ta-progress-top { display: flex; justify-content: space-between; font-size: 16px; margin-bottom: 12px; }
  .ta-bar { height: 8px; background: rgba(255,255,255,0.28); border-radius: 999px; overflow: hidden; }
  .ta-bar div { height: 100%; background: white; border-radius: 999px; transition: width 0.3s; }

  .ta-section-title { font-size: 13px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #8a97ab; margin: 0 0 8px; display: flex; gap: 8px; }
  .ta-section-title span { color: #2d7fe0; }
  .ta-section-title.late, .ta-section-title.late span { color: #c0392b; }
  .ta-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
  .ta-empty, .ta-empty-block { color: #8a97ab; font-size: 14px; background: rgba(255,255,255,0.7); border: 1px dashed rgba(122,178,255,0.4); border-radius: 16px; padding: 18px; text-align: center; list-style: none; }

  .ta-task { display: flex; gap: 12px; align-items: flex-start; background: white; border: 1px solid rgba(122,178,255,0.2); border-radius: 16px; padding: 12px 14px; box-shadow: 0 4px 14px rgba(45,127,224,0.05); }
  .ta-task.done { opacity: 0.55; }
  .ta-task.done .ta-task-title { text-decoration: line-through; }
  .ta-check { flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; border: 2px solid #b5c8e4; background: white; color: white; font-size: 18px; font-weight: 800; display: flex; align-items: center; justify-content: center; padding: 0; }
  .ta-task.done .ta-check { background: #1a8a4f; border-color: #1a8a4f; }
  .ta-task-body { flex: 1; min-width: 0; text-align: left; background: none; border: none; padding: 0; font-family: inherit; color: inherit; display: flex; flex-direction: column; gap: 8px; }
  .ta-task-title { font-size: 16px; font-weight: 600; line-height: 1.35; }
  .ta-chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .ta-chip { font-size: 12px; font-weight: 700; color: #4a5a72; background: rgba(45,127,224,0.09); padding: 3px 10px; border-radius: 999px; }
  .ta-chip.client { color: #2d7fe0; }
  .ta-chip.owner { color: #17653a; background: #ddf3e6; }
  .ta-chip.late { color: #a12c1f; background: #fbe0dc; }
  .ta-chip.kind { color: #8a5a00; background: #fdf0d5; }

  .ta-weeknav { display: flex; align-items: center; justify-content: space-between; text-align: center; }
  .ta-weeknav > button { width: 44px; height: 44px; border-radius: 50%; border: none; background: white; font-size: 24px; color: #2d7fe0; box-shadow: 0 4px 12px rgba(45,127,224,0.1); }
  .ta-weeknav strong { display: block; font-size: 16px; }
  .ta-link { background: none; border: none; color: #2d7fe0; font-family: inherit; font-size: 13px; font-weight: 700; padding: 4px; }
  .ta-strip { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
  .ta-day { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 0; border-radius: 16px; border: 1px solid rgba(122,178,255,0.2); background: white; font-family: inherit; color: #16243a; min-height: 78px; }
  .ta-day-name { font-size: 12px; font-weight: 700; color: #8a97ab; }
  .ta-day-num { font-size: 18px; font-weight: 800; }
  .ta-day-dot { font-size: 11px; font-weight: 800; color: #2d7fe0; min-height: 16px; }
  .ta-day.today .ta-day-num { color: #2d7fe0; }
  .ta-day.sel { background: #2d7fe0; border-color: #2d7fe0; color: white; }
  .ta-day.sel .ta-day-name, .ta-day.sel .ta-day-num, .ta-day.sel .ta-day-dot { color: white; }

  .ta-card { background: white; border: 1px solid rgba(122,178,255,0.2); border-radius: 18px; padding: 18px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 4px 14px rgba(45,127,224,0.05); }
  .ta-card-title { font-size: 17px; font-weight: 800; margin: 0; }
  .ta-card-summary { font-size: 15px; line-height: 1.5; margin: 0; }
  .ta-card-rec { font-size: 14px; line-height: 1.5; color: #3a4a62; margin: 0; }
  .ta-card-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
  .ta-btn { flex: 1; min-height: 48px; padding: 0 18px; border-radius: 14px; border: 1px solid rgba(45,127,224,0.3); background: white; color: #2d7fe0; font-family: inherit; font-size: 16px; font-weight: 700; }
  .ta-btn.primary { background: linear-gradient(135deg, #4a9eff 0%, #2d7fe0 100%); border: none; color: white; box-shadow: 0 6px 16px rgba(74,158,255,0.3); }
  .ta-btn.danger { color: #c0392b; border-color: rgba(192,57,43,0.3); }
  .ta-btn:disabled { opacity: 0.55; }
  .ta-steps { margin: 0; padding-left: 20px; font-size: 14px; color: #4a5a72; line-height: 1.6; }
  .ta-row-link { display: block; width: 100%; text-align: left; background: none; border: none; font-family: inherit; font-size: 16px; font-weight: 700; color: #2d7fe0; text-decoration: none; padding: 10px 0; }
  .ta-row-link.out { color: #c0392b; }

  .ta-fab { position: fixed; right: 20px; bottom: calc(env(safe-area-inset-bottom) + 84px); width: 58px; height: 58px; border-radius: 50%; border: none; background: linear-gradient(135deg, #4a9eff 0%, #2d7fe0 100%); color: white; font-size: 32px; line-height: 1; box-shadow: 0 10px 24px rgba(45,127,224,0.4); z-index: 20; }
  .ta-tabs { position: fixed; left: 0; right: 0; bottom: 0; z-index: 30; display: flex; justify-content: space-around; background: rgba(255,255,255,0.94); backdrop-filter: blur(12px); border-top: 1px solid rgba(122,178,255,0.25); padding: 8px 8px calc(env(safe-area-inset-bottom) + 8px); }
  .ta-tabs button { flex: 1; max-width: 120px; background: none; border: none; font-family: inherit; font-size: 12px; font-weight: 700; color: #8a97ab; display: flex; flex-direction: column; align-items: center; gap: 2px; min-height: 52px; }
  .ta-tabs button.on { color: #2d7fe0; }
  .ta-tab-icon { font-size: 20px; line-height: 1.2; }

  .ta-sheet-backdrop { position: fixed; inset: 0; background: rgba(16,30,52,0.4); z-index: 40; display: flex; align-items: flex-end; justify-content: center; }
  .ta-sheet { width: 100%; max-width: 640px; background: white; border-radius: 24px 24px 0 0; padding: 12px 20px calc(env(safe-area-inset-bottom) + 20px); display: flex; flex-direction: column; gap: 12px; max-height: 90dvh; overflow-y: auto; }
  .ta-sheet-grip { width: 44px; height: 5px; border-radius: 999px; background: #d3dff2; margin: 0 auto 4px; }
  .ta-field { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 700; color: #4a5a72; }
  .ta-input { width: 100%; min-height: 48px; padding: 0 14px; border-radius: 14px; border: 1px solid rgba(122,178,255,0.4); background: #f8fbff; font-family: inherit; font-size: 16px; color: #16243a; }
`;
