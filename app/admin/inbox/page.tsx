"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/api-client";
import { SEO_KINDS, SeoKind } from "@/lib/seo-analysis";
import { TEAM_MEMBERS } from "@/lib/workspace";
import AdminShell from "@/components/admin/AdminShell";
import { AGENCY_PANEL_STYLES } from "@/components/admin/AgencyGooglePanel";
import TeamMemberPicker, { useTeamMember } from "@/components/admin/TeamMemberPicker";

// INTERNAL: this page is for Scramble's team only. Nothing here is shown to clients.

type Status = "new" | "accepted" | "in_progress" | "done" | "dismissed";
type Rating = "useful" | "not_useful";
type Tab = "review" | "progress" | "done" | "dismissed";

interface Item {
  id: string;
  scramble_user_id: string;
  kind: SeoKind;
  summary: string;
  recommendation: string;
  evidence: Record<string, number | string>;
  last_seen_at: string;
  status: Status;
  status_by: string | null;
  owner: string | null;
  rating: Rating | null;
  note: string | null;
  scramble_users: { company_name: string } | { company_name: string }[] | null;
}

const TABS: { key: Tab; label: string; match: (s: Status) => boolean }[] = [
  { key: "review", label: "To review", match: (s) => s === "new" },
  { key: "progress", label: "In progress", match: (s) => s === "accepted" || s === "in_progress" },
  { key: "done", label: "Done", match: (s) => s === "done" },
  { key: "dismissed", label: "Dismissed", match: (s) => s === "dismissed" },
];

const clientName = (i: Item) => {
  const c = Array.isArray(i.scramble_users) ? i.scramble_users[0] : i.scramble_users;
  return c?.company_name || "Unknown client";
};

export default function InboxPage() {
  return (
    <AdminShell>
      <Inbox />
    </AdminShell>
  );
}

function Inbox() {
  const { member, setMember } = useTeamMember();
  const [items, setItems] = useState<Item[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("review");
  const [owner, setOwner] = useState<string>("all");
  const [client, setClient] = useState<string>("all");

  useEffect(() => {
    authFetch("/api/admin/inbox")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setItems(d.suggestions))
      .catch(() => {
        setLoadError(true);
        setItems([]);
      });
  }, []);

  const clients = useMemo(() => {
    const m = new Map<string, string>();
    (items || []).forEach((i) => m.set(i.scramble_user_id, clientName(i)));
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [items]);

  const counts = Object.fromEntries(TABS.map((t) => [t.key, (items || []).filter((i) => t.match(i.status)).length])) as Record<Tab, number>;
  const current = TABS.find((t) => t.key === tab)!;
  const visible = (items || []).filter(
    (i) =>
      current.match(i.status) &&
      (owner === "all" || (owner === "none" ? !i.owner : i.owner === owner)) &&
      (client === "all" || i.scramble_user_id === client)
  );

  const update = async (id: string, patch: Partial<Pick<Item, "status" | "owner" | "rating" | "note">>) => {
    if (!member) return setError("Choose who you are first.");
    setError("");
    const res = await authFetch(`/api/admin/seo/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...patch, by: member }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error || "Couldn't update.");
    setItems((list) => (list || []).map((x) => (x.id === id ? { ...x, ...data.suggestion } : x)));
  };

  return (
    <>
      <style>{AGENCY_PANEL_STYLES}</style>
      <style>{inboxStyles}</style>

      <div style={{ marginBottom: 28 }}>
        <div className="sc-eyebrow-admin">Worker inbox</div>
        <h1 className="admin-title">Suggestions</h1>
        <p className="admin-subtitle">
          Everything the SEO worker has found, across all clients. Internal only: clients never see this page or these notes.
        </p>
      </div>

      <div className="ib-bar">
        <div className="ib-tabs">
          {TABS.map((t) => (
            <button key={t.key} className={`ib-tab ${tab === t.key ? "on" : ""}`} onClick={() => setTab(t.key)}>
              {t.label} <span>{counts[t.key]}</span>
            </button>
          ))}
        </div>
        <TeamMemberPicker member={member} onChange={setMember} />
      </div>

      <div className="ib-filters">
        <select className="sc-input ib-select" value={client} onChange={(e) => setClient(e.target.value)} aria-label="Client">
          <option value="all">All clients</option>
          {clients.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        <select className="sc-input ib-select" value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Owner">
          <option value="all">Anyone</option>
          {TEAM_MEMBERS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
          <option value="none">Unassigned</option>
        </select>
      </div>

      {error && <div className="sc-error" style={{ marginBottom: 14 }}>{error}</div>}

      {items === null ? (
        <div className="ib-empty">Loading…</div>
      ) : loadError ? (
        <div className="sc-error">Couldn&apos;t load the inbox. Refresh to try again.</div>
      ) : visible.length === 0 ? (
        <div className="ib-empty">
          {items.length === 0
            ? "No suggestions yet. Open a client and press Run analysis on its SEO tab."
            : "Nothing here."}
        </div>
      ) : (
        <ul className="ib-list">
          {visible.map((i) => (
            <li key={i.id} className="ib-item">
              <div className="ib-head">
                <Link href={`/admin/clients/${i.scramble_user_id}`} className="ib-client">{clientName(i)}</Link>
                <span className="ib-kind">{SEO_KINDS[i.kind]?.label ?? i.kind}</span>
              </div>
              <p className="seo-summary">{i.summary}</p>
              <p className="seo-rec"><strong>Suggested:</strong> {i.recommendation}</p>
              <div className="seo-meta">
                {Object.entries(i.evidence).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(" · ")}
                {i.status !== "new" && <> · {i.status.replace("_", " ")}{i.status_by ? ` by ${i.status_by}` : ""}</>}
              </div>

              <div className="ib-controls">
                <label className="ib-owner">
                  <span>Owner</span>
                  <select
                    className="sc-input ib-select"
                    value={i.owner ?? ""}
                    onChange={(e) => update(i.id, { owner: (e.target.value || null) as string | null } as never)}
                  >
                    <option value="">Unassigned</option>
                    {TEAM_MEMBERS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </label>
                <div className="ib-rate" role="group" aria-label="Was this useful?">
                  <span>Useful?</span>
                  <button className={`ib-rate-btn ${i.rating === "useful" ? "on" : ""}`} onClick={() => update(i.id, { rating: i.rating === "useful" ? null : "useful" })}>Yes</button>
                  <button className={`ib-rate-btn bad ${i.rating === "not_useful" ? "on" : ""}`} onClick={() => update(i.id, { rating: i.rating === "not_useful" ? null : "not_useful" })}>No</button>
                </div>
              </div>

              <NoteBox value={i.note ?? ""} onSave={(note) => update(i.id, { note })} />

              <div className="seo-actions">
                {i.status === "new" && <button className="agency-btn-primary" onClick={() => update(i.id, { status: "accepted" })}>Accept</button>}
                {i.status === "accepted" && <button className="agency-btn-primary" onClick={() => update(i.id, { status: "in_progress" })}>Start</button>}
                {(i.status === "accepted" || i.status === "in_progress") && <button className="agency-btn-primary" onClick={() => update(i.id, { status: "done" })}>Mark done</button>}
                {(i.status === "new" || i.status === "accepted" || i.status === "in_progress") && <button className="agency-btn-ghost" onClick={() => update(i.id, { status: "dismissed" })}>Dismiss</button>}
                {(i.status === "done" || i.status === "dismissed") && <button className="agency-btn-ghost" onClick={() => update(i.id, { status: "new" })}>Reopen</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function NoteBox({ value, onSave }: { value: string; onSave: (note: string) => void }) {
  const [text, setText] = useState(value);
  const dirty = text.trim() !== value.trim();
  return (
    <div className="ib-note">
      <textarea
        className="sc-input ib-note-input"
        rows={2}
        maxLength={2000}
        placeholder="Internal note (never shown to the client)"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {dirty && <button className="agency-btn-ghost ib-note-save" onClick={() => onSave(text)}>Save note</button>}
    </div>
  );
}

const inboxStyles = `
  .ib-bar { display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 14px; }
  .ib-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
  .ib-tab { padding: 9px 16px; border-radius: 999px; border: 1px solid rgba(122,178,255,0.3); background: white; color: #4a5a72; font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
  .ib-tab span { margin-left: 6px; color: #8a97ab; font-weight: 700; }
  .ib-tab.on { background: #2d7fe0; border-color: #2d7fe0; color: white; }
  .ib-tab.on span { color: rgba(255,255,255,0.8); }
  .ib-filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
  .ib-select { padding: 9px 12px; font-size: 14px; max-width: 260px; }
  .ib-empty { text-align: center; padding: 56px 24px; color: #8a97ab; font-size: 15px; background: rgba(255,255,255,0.7); border: 1px dashed rgba(122,178,255,0.35); border-radius: 18px; }
  .ib-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
  .ib-item { background: rgba(255,255,255,0.94); border: 1px solid rgba(122,178,255,0.18); border-radius: 16px; padding: 18px 20px; }
  .ib-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; }
  .ib-client { font-size: 15px; font-weight: 700; color: #2d7fe0; text-decoration: none; }
  .ib-kind { font-size: 12px; font-weight: 700; color: #8a5a00; background: rgba(244,185,66,0.18); padding: 4px 10px; border-radius: 999px; }
  .seo-summary { font-size: 15px; color: #16243a; line-height: 1.5; margin: 0 0 6px; }
  .seo-rec { font-size: 14px; color: #3a4a62; line-height: 1.5; margin: 0 0 6px; }
  .seo-meta { font-size: 12px; color: #8a97ab; }
  .seo-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
  .ib-controls { display: flex; gap: 20px; align-items: center; flex-wrap: wrap; margin-top: 12px; }
  .ib-owner, .ib-rate { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #4a5a72; }
  .ib-rate-btn { padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(26,138,79,0.3); background: white; color: #1a8a4f; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
  .ib-rate-btn.bad { border-color: rgba(192,57,43,0.3); color: #c0392b; }
  .ib-rate-btn.on { background: #1a8a4f; color: white; }
  .ib-rate-btn.bad.on { background: #c0392b; }
  .ib-note { display: flex; gap: 10px; align-items: flex-start; margin-top: 12px; }
  .ib-note-input { flex: 1; font-size: 14px; resize: vertical; }
  .ib-note-save { padding: 8px 14px; font-size: 13px; color: #2d7fe0; border-color: rgba(45,127,224,0.3); }
`;
