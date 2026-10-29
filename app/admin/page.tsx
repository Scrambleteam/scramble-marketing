"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/api-client";
import {
  AdminClient,
  billingLabel,
  isPayingClient,
  nextAction,
  planLabel,
  serviceLights,
} from "@/lib/client-status";
import AdminShell from "@/components/admin/AdminShell";
import AgencyGooglePanel, { AGENCY_PANEL_STYLES } from "@/components/admin/AgencyGooglePanel";
import ServiceLights from "@/components/admin/ServiceLights";
import { useAgencyGoogle } from "@/components/admin/useAgencyGoogle";

type Filter = "all" | "attention" | "connected";

export default function AdminHubPage() {
  return (
    <AdminShell>
      <ClientHub />
    </AdminShell>
  );
}

function ClientHub() {
  const agency = useAgencyGoogle();
  const [clients, setClients] = useState<AdminClient[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    authFetch("/api/scramble/clients")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setClients(d.clients || []))
      .catch(() => {
        setLoadError(true);
        setClients([]);
      });
  }, []);

  const cards = useMemo(() => {
    return (clients || [])
      .filter(isPayingClient)
      .map((client) => {
        const lights = serviceLights(client, agency.accounts);
        return { client, lights, action: nextAction(client, lights) };
      })
      .sort(
        (a, b) =>
          Number(b.action.attention) - Number(a.action.attention) ||
          a.client.company_name.localeCompare(b.client.company_name)
      );
  }, [clients, agency.accounts]);

  const notPaid = (clients || []).filter((c) => !isPayingClient(c));

  const q = search.trim().toLowerCase();
  const visible = cards.filter(({ client, action }) => {
    if (filter === "attention" && !action.attention) return false;
    if (filter === "connected" && action.text !== "All connected") return false;
    if (!q) return true;
    return [client.company_name, client.email, client.website_domain].some((v) => v?.toLowerCase().includes(q));
  });

  const attentionCount = cards.filter((c) => c.action.attention).length;
  const connectedCount = cards.filter((c) => c.action.text === "All connected").length;

  return (
    <>
      <style>{AGENCY_PANEL_STYLES}</style>
      <style>{hubStyles}</style>

      <div style={{ marginBottom: 32 }}>
        <div className="sc-eyebrow-admin">Client hub</div>
        <h1 className="admin-title">Clients</h1>
        <p className="admin-subtitle">
          Everyone who has signed up and paid. Open a client to check their dashboard and manage their connections.
        </p>
      </div>

      <AgencyGooglePanel status={agency.status} onChange={agency.reload} />

      <div className="hub-stats">
        <Stat value={cards.length} label="Paying clients" />
        <Stat value={attentionCount} label="Need attention" tone={attentionCount ? "warn" : undefined} />
        <Stat value={connectedCount} label="Fully connected" tone={connectedCount ? "good" : undefined} />
        <Stat value={notPaid.length} label="Signed up, not paid" />
      </div>

      <div className="hub-toolbar">
        <input
          className="sc-input hub-search"
          placeholder="Search by name, email or website"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="hub-filters">
          {(
            [
              ["all", "All"],
              ["attention", "Needs attention"],
              ["connected", "Fully connected"],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <button key={key} className={`hub-filter ${filter === key ? "on" : ""}`} onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {clients === null ? (
        <div className="hub-empty">Loading clients…</div>
      ) : loadError ? (
        <div className="sc-error">Couldn&apos;t load clients. Refresh to try again.</div>
      ) : visible.length === 0 ? (
        <div className="hub-empty">
          {cards.length === 0
            ? "No paying clients yet. Clients appear here once they sign up and pay."
            : "No clients match this search or filter."}
        </div>
      ) : (
        <div className="hub-grid">
          {visible.map(({ client, lights, action }) => {
            const billing = billingLabel(client.subscription_status);
            return (
              <Link key={client.id} href={`/admin/clients/${client.id}`} className="hub-card">
                <div className="hub-card-top">
                  <div className="hub-avatar">{client.company_name.trim().charAt(0).toUpperCase()}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="hub-name">{client.company_name}</div>
                    <div className="hub-sub">{client.website_domain || client.email}</div>
                  </div>
                </div>
                <div className="hub-badges">
                  <span className="badge plan">{planLabel(client.tier)}</span>
                  <span className={`badge ${billing.tone}`}>{billing.text}</span>
                </div>
                <ServiceLights lights={lights} />
                <div className={`hub-action ${action.attention ? "attention" : ""}`}>
                  <span>{action.attention ? "⚠ " : action.text === "All connected" ? "✓ " : ""}{action.text}</span>
                  <span className="hub-open">Open →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {notPaid.length > 0 && (
        <details className="hub-notpaid">
          <summary>Signed up, not paid ({notPaid.length})</summary>
          <p className="hub-notpaid-help">
            These people created an account but haven&apos;t completed checkout. They don&apos;t have a dashboard
            until they pay.
          </p>
          <ul>
            {notPaid.map((c) => (
              <li key={c.id}>
                <div>
                  <strong>{c.company_name}</strong> · {c.email}
                </div>
                <div className="hub-notpaid-meta">
                  {billingLabel(c.subscription_status).text} · signed up{" "}
                  {new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone?: "good" | "warn" }) {
  return (
    <div className="hub-stat">
      <div className={`hub-stat-value ${tone || ""}`}>{value}</div>
      <div className="hub-stat-label">{label}</div>
    </div>
  );
}

const hubStyles = `
  .hub-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
  .hub-stat {
    background: rgba(255,255,255,0.92); border: 1px solid rgba(122, 178, 255, 0.16);
    border-radius: 18px; padding: 20px 22px; box-shadow: 0 8px 24px rgba(45, 127, 224, 0.05);
  }
  .hub-stat-value { font-size: 32px; font-weight: 800; letter-spacing: -1px; color: #16243a; }
  .hub-stat-value.good { color: #1a8a4f; }
  .hub-stat-value.warn { color: #e89b1f; }
  .hub-stat-label { font-size: 14px; color: #8a97ab; font-weight: 500; margin-top: 2px; }

  .hub-toolbar { display: flex; gap: 14px; align-items: center; justify-content: space-between; flex-wrap: wrap; margin-bottom: 20px; }
  .hub-search { max-width: 360px; }
  .hub-filters { display: flex; gap: 8px; flex-wrap: wrap; }
  .hub-filter {
    padding: 8px 14px; border-radius: 999px; border: 1px solid rgba(122, 178, 255, 0.3); cursor: pointer;
    background: white; color: #4a5a72; font-family: inherit; font-size: 14px; font-weight: 600;
  }
  .hub-filter.on { background: #2d7fe0; border-color: #2d7fe0; color: white; }

  .hub-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px; }
  .hub-card {
    display: flex; flex-direction: column; gap: 16px; text-decoration: none; color: inherit;
    background: rgba(255,255,255,0.94); border: 1px solid rgba(122, 178, 255, 0.18);
    border-radius: 20px; padding: 22px; box-shadow: 0 10px 28px rgba(45, 127, 224, 0.06);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .hub-card:hover { transform: translateY(-3px); box-shadow: 0 16px 36px rgba(45, 127, 224, 0.13); }
  .hub-card-top { display: flex; align-items: center; gap: 14px; }
  .hub-avatar {
    flex-shrink: 0; width: 44px; height: 44px; border-radius: 13px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 800; color: white;
    background: linear-gradient(135deg, #4a9eff 0%, #2d7fe0 100%);
  }
  .hub-name { font-size: 17px; font-weight: 700; color: #16243a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hub-sub { font-size: 13px; color: #8a97ab; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hub-badges { display: flex; gap: 8px; flex-wrap: wrap; }
  .hub-action {
    display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: auto;
    padding-top: 14px; border-top: 1px solid rgba(122, 178, 255, 0.15);
    font-size: 14px; font-weight: 600; color: #3a4a62;
  }
  .hub-action.attention { color: #a86a0c; }
  .hub-open { flex-shrink: 0; color: #2d7fe0; }

  .hub-empty {
    text-align: center; padding: 56px 24px; color: #8a97ab; font-size: 15px;
    background: rgba(255,255,255,0.7); border: 1px dashed rgba(122, 178, 255, 0.35); border-radius: 18px;
  }

  .hub-notpaid { margin-top: 36px; background: rgba(255,255,255,0.8); border: 1px solid rgba(122, 178, 255, 0.16); border-radius: 18px; padding: 18px 22px; }
  .hub-notpaid summary { cursor: pointer; font-size: 15px; font-weight: 700; color: #4a5a72; }
  .hub-notpaid-help { font-size: 13px; color: #8a97ab; margin: 10px 0 6px; }
  .hub-notpaid ul { list-style: none; margin: 0; padding: 0; }
  .hub-notpaid li { padding: 12px 0; border-top: 1px solid rgba(122, 178, 255, 0.12); font-size: 14px; color: #3a4a62; }
  .hub-notpaid-meta { font-size: 13px; color: #8a97ab; margin-top: 2px; }

  @media (max-width: 860px) {
    .hub-stats { grid-template-columns: repeat(2, 1fr); }
    .hub-search { max-width: none; }
    .hub-grid { grid-template-columns: 1fr; }
  }
`;
