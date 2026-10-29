"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api-client";
import { ClientNote, NOTE_TYPES, NoteType } from "@/lib/workspace";
import TeamMemberPicker, { TeamMember } from "./TeamMemberPicker";

const ADDABLE: NoteType[] = ["note", "action", "alert"];

/** Add notes and see the client's history, newest first. */
export default function ActivityTimeline({
  clientId,
  member,
  onMemberChange,
}: {
  clientId: string;
  member: TeamMember | null;
  onMemberChange: (m: TeamMember) => void;
}) {
  const [notes, setNotes] = useState<ClientNote[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [type, setType] = useState<NoteType>("note");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    authFetch(`/api/admin/clients/${clientId}/notes`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setNotes(d.notes))
      .catch(() => {
        setLoadError(true);
        setNotes([]);
      });
  }, [clientId]);

  const add = async () => {
    if (!member) {
      setError("Choose who you are first.");
      return;
    }
    if (!content.trim()) return;
    setSaving(true);
    setError("");
    const res = await authFetch(`/api/admin/clients/${clientId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, content, author: member }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not add the note.");
      return;
    }
    setNotes((n) => [data.note, ...(n || [])]);
    setContent("");
    setType("note");
  };

  return (
    <div className="act">
      <div className="ws-panel">
        <div className="act-types">
          {ADDABLE.map((t) => (
            <button key={t} type="button" className={`act-type ${type === t ? "on" : ""}`} onClick={() => setType(t)}>
              {NOTE_TYPES[t]}
            </button>
          ))}
        </div>
        <textarea
          className="sc-input act-input"
          rows={3}
          placeholder={
            type === "action" ? "What did you do? e.g. Launched new search campaign" :
            type === "alert" ? "What needs watching? e.g. Traffic down 20% this week" :
            "Add a note about this client"
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="wsf-actions" style={{ position: "static", padding: 0, background: "none" }}>
          <TeamMemberPicker member={member} onChange={onMemberChange} />
          <button onClick={add} disabled={saving || !content.trim()} className="agency-btn-primary">
            {saving ? "Adding…" : "Add"}
          </button>
          {error && <span className="prop-error">{error}</span>}
        </div>
      </div>

      {notes === null ? (
        <p className="ws-help">Loading activity…</p>
      ) : loadError ? (
        <div className="sc-error">Couldn&apos;t load activity. Refresh to try again.</div>
      ) : notes.length === 0 ? (
        <p className="ws-help">No activity yet. Notes, saved briefs and Google account changes appear here.</p>
      ) : (
        <ol className="act-list">
          {notes.map((n) => (
            <li key={n.id} className={`act-item ${n.type}`}>
              <div className="act-meta">
                <span className={`act-tag ${n.type}`}>{NOTE_TYPES[n.type]}</span>
                <span>{n.author}</span>
                <span>·</span>
                <time dateTime={n.created_at}>
                  {new Date(n.created_at).toLocaleString("en-GB", {
                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </time>
              </div>
              <p className="act-content">{n.content}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export const ACTIVITY_STYLES = `
  .act { display: flex; flex-direction: column; gap: 20px; }
  .act-types { display: flex; gap: 6px; flex-wrap: wrap; }
  .act-type {
    padding: 6px 12px; border-radius: 9px; border: 1px solid rgba(122, 178, 255, 0.3); cursor: pointer;
    background: white; color: #4a5a72; font-family: inherit; font-size: 13px; font-weight: 600;
  }
  .act-type.on { background: rgba(74, 158, 255, 0.12); border-color: #4a9eff; color: #2d7fe0; }
  .act-input { resize: vertical; line-height: 1.5; }
  .act-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
  .act-item {
    background: rgba(255,255,255,0.94); border: 1px solid rgba(122, 178, 255, 0.16);
    border-left: 4px solid #9fc7f5; border-radius: 14px; padding: 14px 16px;
  }
  .act-item.action { border-left-color: #34c77b; }
  .act-item.alert { border-left-color: #f4b942; }
  .act-item.system { border-left-color: #c3cddb; background: rgba(255,255,255,0.7); }
  .act-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 13px; color: #8a97ab; margin-bottom: 6px; }
  .act-tag { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 8px; border-radius: 6px; }
  .act-tag.note { color: #2d7fe0; background: rgba(74, 158, 255, 0.12); }
  .act-tag.action { color: #1a8a4f; background: rgba(52, 199, 123, 0.12); }
  .act-tag.alert { color: #a86a0c; background: rgba(244, 185, 66, 0.16); }
  .act-tag.system { color: #5a6b82; background: rgba(122, 178, 255, 0.12); }
  .act-content { font-size: 15px; color: #16243a; line-height: 1.55; white-space: pre-wrap; word-break: break-word; }
`;
