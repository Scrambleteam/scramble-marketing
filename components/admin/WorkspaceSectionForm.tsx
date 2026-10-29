"use client";

import { useState } from "react";
import { authFetch } from "@/lib/api-client";
import { SECTION_FIELDS, SectionKey, SectionValues } from "@/lib/workspace";
import TeamMemberPicker, { TeamMember } from "./TeamMemberPicker";

export interface SectionState {
  values: SectionValues;
  updatedAt: string | null;
  updatedBy: string | null;
}

/** Edit form for one workspace section (brief or strategy). */
export default function WorkspaceSectionForm({
  clientId,
  section,
  initial,
  member,
  onMemberChange,
  onSaved,
}: {
  clientId: string;
  section: SectionKey;
  initial: SectionState;
  member: TeamMember | null;
  onMemberChange: (m: TeamMember) => void;
  onSaved: (s: SectionState) => void;
}) {
  const fields = SECTION_FIELDS[section];
  const toForm = (v: SectionValues) =>
    Object.fromEntries(fields.map((f) => [f.key, v[f.key] === null || v[f.key] === undefined ? "" : String(v[f.key])]));

  const [form, setForm] = useState<Record<string, string>>(() => toForm(initial.values));
  const [saved, setSaved] = useState<Record<string, string>>(() => toForm(initial.values));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  const dirty = fields.some((f) => form[f.key] !== saved[f.key]);

  const save = async () => {
    if (!member) {
      setError("Choose who you are first.");
      return;
    }
    setSaving(true);
    setError("");
    setJustSaved(false);
    const res = await authFetch(`/api/admin/clients/${clientId}/workspace`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, values: form, by: member }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save.");
      return;
    }
    const next: SectionState = {
      values: data[section] ?? {},
      updatedAt: data[`${section}_updated_at`] ?? null,
      updatedBy: data[`${section}_updated_by`] ?? null,
    };
    const asForm = toForm(next.values);
    setForm(asForm);
    setSaved(asForm);
    setJustSaved(true);
    onSaved(next);
  };

  return (
    <div className="wsf">
      {fields.map((f) => (
        <label key={f.key} className="wsf-field">
          <span className="wsf-label">{f.label}</span>
          {f.hint && <span className="wsf-hint">{f.hint}</span>}
          {f.kind === "money" ? (
            <input
              className="sc-input wsf-money"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={form[f.key]}
              onChange={(e) => {
                setJustSaved(false);
                setForm((v) => ({ ...v, [f.key]: e.target.value }));
              }}
            />
          ) : (
            <textarea
              className="sc-input wsf-text"
              rows={3}
              value={form[f.key]}
              onChange={(e) => {
                setJustSaved(false);
                setForm((v) => ({ ...v, [f.key]: e.target.value }));
              }}
            />
          )}
        </label>
      ))}

      <div className="wsf-actions">
        <TeamMemberPicker member={member} onChange={onMemberChange} />
        <button onClick={save} disabled={!dirty || saving} className="agency-btn-primary">
          {saving ? "Saving…" : "Save"}
        </button>
        {justSaved && <span className="prop-saved">Saved</span>}
        {error && <span className="prop-error">{error}</span>}
      </div>
    </div>
  );
}

export const WORKSPACE_FORM_STYLES = `
  .wsf { display: flex; flex-direction: column; gap: 18px; }
  .wsf-field { display: flex; flex-direction: column; gap: 6px; }
  .wsf-label { font-size: 14px; font-weight: 700; color: #16243a; }
  .wsf-hint { font-size: 13px; color: #8a97ab; margin-top: -3px; }
  .wsf-text { resize: vertical; min-height: 76px; line-height: 1.5; }
  .wsf-money { max-width: 220px; }
  .wsf-actions {
    position: sticky; bottom: 0; z-index: 2;
    display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
    padding: 14px 0 4px; background: linear-gradient(180deg, rgba(255,255,255,0), #fff 30%);
  }
`;
