"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api-client";
import { ClientUpdate, UPDATE_KINDS, UpdateKind } from "@/lib/client-updates";
import TeamMemberPicker, { TeamMember } from "./TeamMemberPicker";

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

/**
 * What the client sees on their Overview tab: wins, what we did, what's next.
 * Items are drafts until a team member publishes them. Wins can be drafted from
 * the client's real data. Clients never see drafts or the evidence behind them.
 */
export default function ClientUpdates({
  clientId,
  member,
  onMemberChange,
}: {
  clientId: string;
  member: TeamMember | null;
  onMemberChange: (m: TeamMember) => void;
}) {
  const [items, setItems] = useState<ClientUpdate[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [form, setForm] = useState<{ kind: UpdateKind; body: string }>({ kind: "next", body: "" });
  const [saving, setSaving] = useState(false);

  const load = () =>
    authFetch(`/api/admin/clients/${clientId}/updates`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setItems(d.updates))
      .catch(() => {
        setLoadError(true);
        setItems([]);
      });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const requireMember = () => {
    if (!member) {
      setError("Choose who you are first.");
      return false;
    }
    return true;
  };

  const draftWins = async () => {
    if (!requireMember()) return;
    setDrafting(true);
    setError("");
    setMessage("");
    const res = await authFetch(`/api/admin/clients/${clientId}/updates/draft-wins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ by: member }),
    });
    const data = await res.json().catch(() => ({}));
    setDrafting(false);
    if (!res.ok) return setError(data.error || "Couldn't draft wins.");
    setMessage(
      data.added > 0
        ? `${data.added} draft win${data.added === 1 ? "" : "s"} added below for you to review.`
        : data.found > 0
          ? "Nothing new: those wins were already drafted this month."
          : "No wins found in the data yet."
    );
    if (data.skipped?.length) setMessage((m) => `${m} Skipped: ${data.skipped.join("; ")}.`);
    await load();
  };

  const add = async (publish: boolean) => {
    if (!requireMember()) return;
    setSaving(true);
    setError("");
    const res = await authFetch(`/api/admin/clients/${clientId}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: form.kind, body: form.body, publish, by: member }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(data.error || "Couldn't save.");
    setItems((list) => [data.update, ...(list || [])]);
    setForm((f) => ({ ...f, body: "" }));
  };

  const patch = async (id: string, body: Record<string, string>) => {
    if (!requireMember()) return false;
    setBusyId(id);
    setError("");
    const res = await authFetch(`/api/admin/updates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, by: member }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      setError(data.error || "Couldn't update.");
      return false;
    }
    setItems((list) => (list || []).map((x) => (x.id === id ? { ...x, ...data.update } : x)));
    return true;
  };

  const remove = async (id: string) => {
    if (!requireMember() || !confirm("Delete this item?")) return;
    setBusyId(id);
    const res = await authFetch(`/api/admin/updates/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) return setError("Couldn't delete.");
    setItems((list) => (list || []).filter((x) => x.id !== id));
  };

  const drafts = (items || []).filter((i) => i.status === "draft");
  const published = (items || []).filter((i) => i.status === "published");

  const row = (i: ClientUpdate) => (
    <li key={i.id} className="cu-item">
      <div className="cu-top">
        <span className="cu-kind">{UPDATE_KINDS[i.kind]}</span>
        {i.auto_drafted && <span className="cu-auto">Drafted from data</span>}
      </div>
      {editing?.id === i.id ? (
        <>
          <textarea className="sc-input cu-edit" rows={3} maxLength={400} value={editing.text} onChange={(e) => setEditing({ id: i.id, text: e.target.value })} />
          <div className="cu-actions">
            <button className="agency-btn-primary" disabled={busyId === i.id} onClick={async () => { if (await patch(i.id, { body: editing.text })) setEditing(null); }}>Save wording</button>
            <button className="agency-btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <p className="cu-body">{i.body}</p>
          {Object.keys(i.evidence || {}).length > 0 && (
            <p className="cu-meta">Evidence (internal): {Object.entries(i.evidence).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(" · ")}</p>
          )}
          <p className="cu-meta">
            {i.status === "published"
              ? `Published ${fmt(i.published_at)}${i.published_by ? ` by ${i.published_by}` : ""}`
              : `Draft${i.created_by ? ` by ${i.created_by}` : ""}, not visible to the client`}
          </p>
          <div className="cu-actions">
            {i.status === "draft" ? (
              <button className="agency-btn-primary" disabled={busyId === i.id} onClick={() => patch(i.id, { status: "published" })}>Approve and publish</button>
            ) : (
              <button className="agency-btn-ghost" disabled={busyId === i.id} onClick={() => patch(i.id, { status: "draft" })}>Unpublish</button>
            )}
            <button className="agency-btn-ghost cu-neutral" onClick={() => setEditing({ id: i.id, text: i.body })}>Edit</button>
            <button className="agency-btn-ghost" disabled={busyId === i.id} onClick={() => remove(i.id)}>Delete</button>
          </div>
        </>
      )}
    </li>
  );

  return (
    <div className="cu">
      <p className="ws-help">
        What the client reads on the Overview tab of their dashboard. Everything starts as a draft. A client only sees
        what you publish, and never the evidence or drafts.
      </p>

      <div className="ws-panel">
        <div className="cu-bar">
          <button onClick={draftWins} disabled={drafting} className="agency-btn-primary">
            {drafting ? "Looking at the data…" : "Draft wins from data"}
          </button>
          <TeamMemberPicker member={member} onChange={onMemberChange} />
        </div>
        {message && <div className="sc-success">{message}</div>}
        {error && <div className="sc-error">{error}</div>}
      </div>

      <div className="ws-panel">
        <h2 className="ws-panel-title">Write one yourself</h2>
        <div className="cu-form">
          <select className="sc-input" value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as UpdateKind }))}>
            {(Object.keys(UPDATE_KINDS) as UpdateKind[]).map((k) => (
              <option key={k} value={k}>{UPDATE_KINDS[k]}</option>
            ))}
          </select>
          <textarea className="sc-input" rows={2} maxLength={400} placeholder="Plain English, a sentence or two." value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
          <div className="cu-actions">
            <button className="agency-btn-ghost cu-neutral" disabled={saving || !form.body.trim()} onClick={() => add(false)}>Save as draft</button>
            <button className="agency-btn-primary" disabled={saving || !form.body.trim()} onClick={() => add(true)}>Publish now</button>
          </div>
        </div>
      </div>

      {items === null ? (
        <p className="ws-help">Loading…</p>
      ) : loadError ? (
        <div className="sc-error">Couldn&apos;t load updates. Refresh to try again.</div>
      ) : (
        <>
          <section>
            <h3 className="cu-title">Drafts to approve <span>({drafts.length})</span></h3>
            {drafts.length === 0 ? <p className="ws-help">No drafts. Press “Draft wins from data” or write one.</p> : <ul className="cu-list">{drafts.map(row)}</ul>}
          </section>
          <section>
            <h3 className="cu-title">Published, visible to the client <span>({published.length})</span></h3>
            {published.length === 0 ? <p className="ws-help">Nothing published yet.</p> : <ul className="cu-list">{published.map(row)}</ul>}
          </section>
        </>
      )}
    </div>
  );
}

export const CLIENT_UPDATES_STYLES = `
  .cu { display: flex; flex-direction: column; gap: 18px; }
  .cu-bar { display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap; }
  .cu-form { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
  .cu-title { font-size: 17px; font-weight: 700; color: #16243a; margin-bottom: 10px; }
  .cu-title span { color: #8a97ab; font-weight: 600; }
  .cu-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
  .cu-item { background: rgba(255,255,255,0.94); border: 1px solid rgba(122,178,255,0.18); border-radius: 16px; padding: 16px 18px; }
  .cu-top { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
  .cu-kind { font-size: 12px; font-weight: 700; color: #2d7fe0; background: rgba(74,158,255,0.12); padding: 3px 10px; border-radius: 999px; }
  .cu-auto { font-size: 12px; font-weight: 700; color: #8a5a00; background: rgba(244,185,66,0.18); padding: 3px 10px; border-radius: 999px; }
  .cu-body { font-size: 15px; color: #16243a; line-height: 1.5; margin: 0 0 6px; }
  .cu-meta { font-size: 12px; color: #8a97ab; margin: 0 0 4px; }
  .cu-edit { width: 100%; font-size: 14px; }
  .cu-actions { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
  .cu-neutral { color: #4a5a72; border-color: rgba(122,178,255,0.35); }
`;
