"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api-client";
import { CHANGE_STATUS, CHANGE_TYPES, CampaignChange, ChangeType } from "@/lib/change-log";
import TeamMemberPicker, { TeamMember } from "./TeamMemberPicker";

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

/** Campaign change log for one client: record changes, then approve, reject or mark applied. */
export default function ChangeLog({
  clientId,
  member,
  onMemberChange,
}: {
  clientId: string;
  member: TeamMember | null;
  onMemberChange: (m: TeamMember) => void;
}) {
  const [changes, setChanges] = useState<CampaignChange[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState({ change_type: "budget" as ChangeType, summary: "", campaign_name: "", google_customer_id: "", before_value: "", after_value: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authFetch(`/api/admin/clients/${clientId}/changes`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setChanges(d.changes))
      .catch(() => {
        setLoadError(true);
        setChanges([]);
      });
  }, [clientId]);

  const requireMember = () => {
    if (!member) {
      setError("Choose who you are first.");
      return false;
    }
    return true;
  };

  const record = async () => {
    if (!requireMember()) return;
    setSaving(true);
    setError("");
    const res = await authFetch(`/api/admin/clients/${clientId}/changes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, by: member }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(data.error || "Could not record the change.");
    setChanges((c) => [data.change, ...(c || [])]);
    setForm({ change_type: "budget", summary: "", campaign_name: "", google_customer_id: "", before_value: "", after_value: "" });
  };

  const act = async (id: string, action: "approve" | "reject" | "applied") => {
    if (!requireMember()) return;
    setBusyId(id);
    setError("");
    const res = await authFetch(`/api/admin/changes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, by: member }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) return setError(data.error || "Could not update the change.");
    setChanges((c) => (c || []).map((x) => (x.id === id ? data.change : x)));
  };

  return (
    <div className="cl">
      <p className="ws-help cl-note">
        Scramble doesn&apos;t change Google Ads automatically yet. Record a change here, get it approved, then mark it
        applied once it&apos;s been made in Google Ads.
      </p>

      <div className="ws-panel">
        <h3 className="ws-panel-title">Record a change</h3>
        <div className="cl-form">
          <label className="cl-field">
            <span className="prop-label">What kind of change</span>
            <select className="sc-input" value={form.change_type} onChange={(e) => setForm({ ...form, change_type: e.target.value as ChangeType })}>
              {(Object.keys(CHANGE_TYPES) as ChangeType[]).map((t) => (
                <option key={t} value={t}>{CHANGE_TYPES[t]}</option>
              ))}
            </select>
          </label>
          <label className="cl-field">
            <span className="prop-label">Campaign (optional)</span>
            <input className="sc-input" value={form.campaign_name} onChange={(e) => setForm({ ...form, campaign_name: e.target.value })} />
          </label>
          <label className="cl-field cl-wide">
            <span className="prop-label">What should change</span>
            <textarea className="sc-input" rows={2} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          </label>
          <label className="cl-field">
            <span className="prop-label">Before (optional)</span>
            <input className="sc-input" value={form.before_value} onChange={(e) => setForm({ ...form, before_value: e.target.value })} />
          </label>
          <label className="cl-field">
            <span className="prop-label">After (optional)</span>
            <input className="sc-input" value={form.after_value} onChange={(e) => setForm({ ...form, after_value: e.target.value })} />
          </label>
        </div>
        <div className="wsf-actions" style={{ position: "static", padding: 0, background: "none" }}>
          <TeamMemberPicker member={member} onChange={onMemberChange} />
          <button onClick={record} disabled={saving || !form.summary.trim()} className="agency-btn-primary">
            {saving ? "Recording…" : "Record change"}
          </button>
          {error && <span className="prop-error">{error}</span>}
        </div>
      </div>

      {changes === null ? (
        <p className="ws-help">Loading changes…</p>
      ) : loadError ? (
        <div className="sc-error">Couldn&apos;t load changes. Refresh to try again.</div>
      ) : changes.length === 0 ? (
        <p className="ws-help">No changes recorded yet.</p>
      ) : (
        <ol className="cl-list">
          {changes.map((c) => {
            const status = CHANGE_STATUS[c.status];
            return (
              <li key={c.id} className="cl-item">
                <div className="cl-top">
                  <span className={`badge ${status.tone}`}>{status.label}</span>
                  <span className="cl-type">{CHANGE_TYPES[c.change_type]}</span>
                  {c.campaign_name && <span className="cl-campaign">· {c.campaign_name}</span>}
                </div>
                <p className="cl-summary">{c.summary}</p>
                {(c.before_value || c.after_value) && (
                  <p className="cl-diff">
                    {c.before_value || "—"} <span>→</span> {c.after_value || "—"}
                  </p>
                )}
                <div className="cl-meta">
                  Proposed by {c.proposed_by} · {fmt(c.created_at)}
                  {c.approved_by && <> · Approved by {c.approved_by} · {fmt(c.approved_at)}</>}
                  {c.applied_by && <> · Applied by {c.applied_by} · {fmt(c.applied_at)}</>}
                </div>
                {c.status === "proposed" && (
                  <div className="cl-actions">
                    <button className="agency-btn-primary" disabled={busyId === c.id} onClick={() => act(c.id, "approve")}>Approve</button>
                    <button className="agency-btn-ghost" disabled={busyId === c.id} onClick={() => act(c.id, "reject")}>Reject</button>
                  </div>
                )}
                {c.status === "approved" && (
                  <div className="cl-actions">
                    <button className="agency-btn-primary" disabled={busyId === c.id} onClick={() => act(c.id, "applied")}>Mark applied in Google Ads</button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export const CHANGE_LOG_STYLES = `
  .cl { display: flex; flex-direction: column; gap: 18px; }
  .cl-note { margin: 0; }
  .cl-form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 14px; }
  .cl-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .cl-wide { grid-column: 1 / -1; }
  .cl-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
  .cl-item { background: rgba(255,255,255,0.94); border: 1px solid rgba(122, 178, 255, 0.18); border-radius: 16px; padding: 16px 18px; }
  .cl-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .cl-type { font-size: 13px; font-weight: 700; color: #4a5a72; }
  .cl-campaign { font-size: 13px; color: #8a97ab; }
  .cl-summary { font-size: 15px; color: #16243a; margin: 8px 0 4px; line-height: 1.5; }
  .cl-diff { font-size: 14px; color: #3a4a62; margin: 0 0 4px; }
  .cl-diff span { color: #8a97ab; margin: 0 4px; }
  .cl-meta { font-size: 12px; color: #8a97ab; }
  .cl-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
  @media (max-width: 700px) { .cl-form { grid-template-columns: 1fr; } }
`;
