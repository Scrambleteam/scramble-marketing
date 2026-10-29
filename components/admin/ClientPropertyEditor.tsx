"use client";

import { useState } from "react";
import { authFetch } from "@/lib/api-client";
import { ServiceKey } from "@/lib/tiers";
import { AgencyAccounts } from "@/lib/client-status";

export interface Assignments {
  site_url: string | null;
  analytics_property_id: string | null;
  ads_customer_id: string | null;
}

const FIELDS: {
  service: ServiceKey;
  field: keyof Assignments;
  listing: keyof AgencyAccounts;
  label: string;
}[] = [
  { service: "search_console", field: "site_url", listing: "searchConsole", label: "Search Console site" },
  { service: "analytics", field: "analytics_property_id", listing: "analytics", label: "GA4 property" },
  { service: "ads", field: "ads_customer_id", listing: "ads", label: "Google Ads account" },
];

/**
 * Lets an admin choose which of the agency account's properties feed one
 * client's dashboard. Only shows the services in the client's plan.
 */
export default function ClientPropertyEditor({
  clientId,
  services,
  initial,
  accounts,
  onSaved,
}: {
  clientId: string;
  services: ServiceKey[];
  initial: Assignments;
  accounts: AgencyAccounts | null;
  onSaved: (a: Assignments & { google_connected: boolean }) => void;
}) {
  const [values, setValues] = useState<Assignments>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const fields = FIELDS.filter((f) => services.includes(f.service));
  const dirty = fields.some((f) => (values[f.field] || null) !== (initial[f.field] || null));

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    const body = Object.fromEntries(fields.map((f) => [f.field, values[f.field] || null]));
    const res = await authFetch(`/api/admin/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save.");
      return;
    }
    setSaved(true);
    onSaved(data.client);
  };

  if (fields.length === 0) {
    return <p className="prop-hint">This plan has no Google services to assign.</p>;
  }

  return (
    <div className="prop-editor">
      {fields.map((f) => {
        const listing = accounts?.[f.listing];
        const current = values[f.field] || "";
        const options = listing && "options" in listing ? listing.options : [];
        const missing = current && !options.some((o) => o.id === current);
        return (
          <label key={f.field} className="prop-field">
            <span className="prop-label">{f.label}</span>
            <select
              className="sc-input prop-select"
              value={current}
              disabled={!accounts}
              onChange={(e) => {
                setSaved(false);
                setValues((v) => ({ ...v, [f.field]: e.target.value || null }));
              }}
            >
              <option value="">Not assigned</option>
              {missing && <option value={current}>{current} (not visible to agency account)</option>}
              {options.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
            {listing && "error" in listing && <span className="prop-error">{listing.error}</span>}
            {listing && "options" in listing && options.length === 0 && (
              <span className="prop-hint">Nothing shared with the agency account yet.</span>
            )}
          </label>
        );
      })}
      <div className="prop-actions">
        <button onClick={save} disabled={!dirty || saving} className="agency-btn-primary">
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && <span className="prop-saved">Saved</span>}
        {error && <span className="prop-error">{error}</span>}
      </div>
    </div>
  );
}

export const PROPERTY_EDITOR_STYLES = `
  .prop-editor { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; width: 100%; padding-top: 16px; border-top: 1px solid rgba(122,178,255,0.15); }
  .prop-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .prop-label { font-size: 13px; font-weight: 600; color: #4a5a72; }
  .prop-select { padding: 10px 12px; font-size: 14px; }
  .prop-actions { grid-column: 1 / -1; display: flex; align-items: center; gap: 12px; }
  .prop-hint { font-size: 12px; color: #8a97ab; }
  .prop-error { font-size: 12px; color: #c0392b; }
  .prop-saved { font-size: 13px; font-weight: 600; color: #1a8a4f; }
  @media (max-width: 860px) { .prop-editor { grid-template-columns: 1fr; } }
`;
