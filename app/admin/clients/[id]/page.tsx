"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { authFetch } from "@/lib/api-client";
import { AGENCY_GOOGLE_EMAIL } from "@/lib/admin";
import { GOOGLE_ACCESS_STEPS } from "@/lib/agency-access";
import {
  AdminClient,
  billingLabel,
  clientServices,
  nextAction,
  planLabel,
  serviceLights,
} from "@/lib/client-status";
import AdminShell from "@/components/admin/AdminShell";
import ServiceLights from "@/components/admin/ServiceLights";
import ClientPropertyEditor, { PROPERTY_EDITOR_STYLES } from "@/components/admin/ClientPropertyEditor";
import { AGENCY_PANEL_STYLES } from "@/components/admin/AgencyGooglePanel";
import { useAgencyGoogle } from "@/components/admin/useAgencyGoogle";
import ServiceMetricsCard, { ServiceData, SERVICE_CARD_STYLES } from "@/components/dashboard/ServiceMetricsCard";
import WorkspaceSectionForm, { SectionState, WORKSPACE_FORM_STYLES } from "@/components/admin/WorkspaceSectionForm";
import ActivityTimeline, { ACTIVITY_STYLES } from "@/components/admin/ActivityTimeline";
import { TEAM_PICKER_STYLES, useTeamMember } from "@/components/admin/TeamMemberPicker";
import { SectionKey, sectionIsEmpty } from "@/lib/workspace";

type Tab = "overview" | "connections" | "brief" | "strategy" | "activity";
type Metrics = Partial<Record<"search_console" | "analytics" | "ads", ServiceData>>;

export default function ClientWorkspacePage() {
  return (
    <AdminShell>
      <ClientWorkspace />
    </AdminShell>
  );
}

function ClientWorkspace() {
  const { id } = useParams<{ id: string }>();
  const agency = useAgencyGoogle();
  const [client, setClient] = useState<AdminClient | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metricsKey, setMetricsKey] = useState(0);
  const [sections, setSections] = useState<Record<SectionKey, SectionState> | null>(null);
  const [sectionsError, setSectionsError] = useState(false);
  const team = useTeamMember();

  useEffect(() => {
    authFetch(`/api/admin/clients/${id}/workspace`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) =>
        setSections({
          brief: { values: d.brief ?? {}, updatedAt: d.brief_updated_at, updatedBy: d.brief_updated_by },
          strategy: { values: d.strategy ?? {}, updatedAt: d.strategy_updated_at, updatedBy: d.strategy_updated_by },
        })
      )
      .catch(() => setSectionsError(true));
  }, [id]);

  useEffect(() => {
    authFetch(`/api/admin/clients/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setClient(d.client))
      .catch(() => setNotFound(true));
  }, [id]);

  // Reloaded after assignments change so the Overview matches what the client sees
  useEffect(() => {
    authFetch(`/api/admin/clients/${id}/metrics`)
      .then((r) => (r.ok ? r.json() : {}))
      .then(setMetrics)
      .catch(() => setMetrics({}));
  }, [id, metricsKey]);

  if (notFound) {
    return (
      <div className="ws-empty">
        <p>This client couldn&apos;t be found.</p>
        <Link href="/admin" className="sc-link">← Back to all clients</Link>
      </div>
    );
  }
  if (!client) return <div className="ws-empty">Loading client…</div>;

  const lights = serviceLights(client, agency.accounts);
  const action = nextAction(client, lights);
  const billing = billingLabel(client.subscription_status);
  const services = clientServices(client);
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <>
      <style>{SERVICE_CARD_STYLES}</style>
      <style>{AGENCY_PANEL_STYLES}</style>
      <style>{PROPERTY_EDITOR_STYLES}</style>
      <style>{WORKSPACE_FORM_STYLES}</style>
      <style>{ACTIVITY_STYLES}</style>
      <style>{TEAM_PICKER_STYLES}</style>
      <style>{wsStyles}</style>

      <Link href="/admin" className="sc-link ws-back">← All clients</Link>

      <div className="ws-header">
        <div className="ws-avatar">{client.company_name.trim().charAt(0).toUpperCase()}</div>
        <div style={{ minWidth: 0 }}>
          <h1 className="ws-title">{client.company_name}</h1>
          <div className="ws-meta">
            {client.email}
            {client.website_domain && <> · {client.website_domain}</>}
          </div>
          <div className="ws-badges">
            <span className="badge plan">{planLabel(client.tier)}</span>
            <span className={`badge ${billing.tone}`}>{billing.text}</span>
            <span className="ws-dates">
              Signed up {fmtDate(client.created_at)}
              {client.current_period_end && <> · renews {fmtDate(client.current_period_end)}</>}
            </span>
          </div>
        </div>
      </div>

      <div className={`ws-action ${action.attention ? "attention" : ""}`}>
        <strong>Next step:</strong> {action.text}
      </div>

      <div className="ws-tabs" role="tablist">
        {(
          [
            ["overview", "Overview"],
            ["connections", "Connections"],
            ["brief", "Brief"],
            ["strategy", "Strategy"],
            ["activity", "Activity"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} className={`ws-tab ${tab === key ? "on" : ""}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "brief" || tab === "strategy" ? (
        <div className="ws-section">
          {sectionsError ? (
            <div className="sc-error">Couldn&apos;t load the {tab}. Refresh to try again.</div>
          ) : !sections ? (
            <p className="ws-help">Loading…</p>
          ) : (
            <div className="ws-panel">
              <p className="ws-help">
                {tab === "brief"
                  ? "What the business does and wants, captured after the first call. Everything else builds on this."
                  : "The working plan for this client: what we're doing, why, and what's next."}
                {sections[tab].updatedAt ? (
                  <> Last saved {new Date(sections[tab].updatedAt!).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  {sections[tab].updatedBy && <> by {sections[tab].updatedBy}</>}.</>
                ) : sectionIsEmpty(tab, sections[tab].values) ? " Not written yet." : null}
              </p>
              <WorkspaceSectionForm
                key={tab}
                clientId={client.id}
                section={tab}
                initial={sections[tab]}
                member={team.member}
                onMemberChange={team.setMember}
                onSaved={(next) => {
                  setSections((s) => (s ? { ...s, [tab]: next } : s));
                  if (tab === "brief") {
                    setClient((c) => (c ? { ...c, client_workspace: { brief_updated_at: next.updatedAt } } : c));
                  }
                }}
              />
            </div>
          )}
        </div>
      ) : tab === "activity" ? (
        <div className="ws-section">
          <ActivityTimeline clientId={client.id} member={team.member} onMemberChange={team.setMember} />
        </div>
      ) : tab === "overview" ? (
        <div className="ws-section">
          <p className="ws-help">This is what {client.company_name} sees on their dashboard right now.</p>
          <div className="ws-cards">
            {services.map((service) => (
              <ServiceMetricsCard
                key={service}
                service={service}
                data={service === "meta_ads" ? undefined : metrics ? metrics[service] ?? null : undefined}
                metaConnected={!!client.meta_connected}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="ws-section">
          <div className="ws-panel">
            <h2 className="ws-panel-title">Status</h2>
            <ServiceLights lights={lights} showState />
            {!agency.status?.connected && agency.status && (
              <p className="ws-warn">
                The agency Google account isn&apos;t connected, so assignments can&apos;t be checked.{" "}
                <Link href="/admin" className="sc-link">Connect it on the hub →</Link>
              </p>
            )}
          </div>

          <div className="ws-panel">
            <h2 className="ws-panel-title">Google accounts</h2>
            <p className="ws-help">
              Choose which of the agency account&apos;s properties feed this client&apos;s dashboard.
              {agency.accountsLoading && " Loading what the agency account can see…"}
            </p>
            <ClientPropertyEditor
              clientId={client.id}
              services={services}
              initial={{
                site_url: client.site_url,
                analytics_property_id: client.analytics_property_id,
                ads_customer_id: client.ads_customer_id,
              }}
              accounts={agency.accounts}
              onSaved={(saved) => {
                setClient((c) => (c ? { ...c, ...saved } : c));
                setMetricsKey((k) => k + 1);
              }}
            />
          </div>

          {services.includes("meta_ads") && (
            <div className="ws-panel">
              <h2 className="ws-panel-title">Meta</h2>
              <p className="ws-help">
                {client.meta_connected
                  ? "The client has connected their Meta account."
                  : "The client hasn't connected Meta yet. They do this themselves from their dashboard settings."}
              </p>
            </div>
          )}

          <AccessInstructions services={services} />
        </div>
      )}
    </>
  );
}

/** Copyable instructions to send a client who hasn't shared access yet */
function AccessInstructions({ services }: { services: string[] }) {
  const [copied, setCopied] = useState(false);
  const steps = services
    .map((s) => GOOGLE_ACCESS_STEPS[s as keyof typeof GOOGLE_ACCESS_STEPS])
    .filter((s): s is { title: string; steps: string } => !!s);
  if (steps.length === 0) return null;

  const text = [
    `Please add ${AGENCY_GOOGLE_EMAIL} as a user on your Google accounts:`,
    "",
    ...steps.map((s) => `• ${s.title}: ${s.steps}`),
  ].join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked; the text is visible to copy by hand
    }
  };

  return (
    <div className="ws-panel">
      <div className="ws-panel-head">
        <h2 className="ws-panel-title">Access instructions</h2>
        <button onClick={copy} className="agency-btn-ghost ws-copy">{copied ? "Copied" : "Copy"}</button>
      </div>
      <p className="ws-help">Send this to the client if they haven&apos;t shared access yet.</p>
      <pre className="ws-instructions">{text}</pre>
    </div>
  );
}

const wsStyles = `
  .ws-empty { text-align: center; padding: 80px 20px; color: #8a97ab; display: flex; flex-direction: column; gap: 14px; align-items: center; }
  .ws-back { display: inline-block; font-size: 14px; margin-bottom: 18px; }
  .ws-header { display: flex; gap: 18px; align-items: flex-start; margin-bottom: 20px; }
  .ws-avatar {
    flex-shrink: 0; width: 60px; height: 60px; border-radius: 17px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; font-weight: 800; color: white;
    background: linear-gradient(135deg, #4a9eff 0%, #2d7fe0 100%);
    box-shadow: 0 8px 20px rgba(74, 158, 255, 0.3);
  }
  .ws-title { font-size: 30px; font-weight: 800; letter-spacing: -0.8px; color: #16243a; }
  .ws-meta { font-size: 14px; color: #8a97ab; margin: 2px 0 10px; word-break: break-all; }
  .ws-badges { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .ws-dates { font-size: 13px; color: #8a97ab; }

  .ws-action {
    padding: 14px 18px; border-radius: 14px; font-size: 15px; color: #1a8a4f; margin-bottom: 24px;
    background: rgba(52, 199, 123, 0.1); border: 1px solid rgba(52, 199, 123, 0.25);
  }
  .ws-action.attention { color: #a86a0c; background: rgba(244, 185, 66, 0.12); border-color: rgba(244, 185, 66, 0.35); }

  .ws-tabs { display: flex; gap: 6px; border-bottom: 1px solid rgba(122, 178, 255, 0.2); margin-bottom: 24px; overflow-x: auto; }
  .ws-tab {
    padding: 10px 16px; border: none; background: none; cursor: pointer; font-family: inherit;
    font-size: 15px; font-weight: 600; color: #8a97ab; border-bottom: 2px solid transparent; margin-bottom: -1px; white-space: nowrap;
  }
  .ws-tab.on { color: #2d7fe0; border-bottom-color: #2d7fe0; }

  .ws-section { display: flex; flex-direction: column; gap: 20px; }
  .ws-help { font-size: 14px; color: #5a6b82; line-height: 1.55; }
  .ws-cards { display: flex; flex-direction: column; gap: 20px; }
  .ws-panel {
    background: rgba(255,255,255,0.94); border: 1px solid rgba(122, 178, 255, 0.18);
    border-radius: 20px; padding: 22px 24px; box-shadow: 0 8px 24px rgba(45, 127, 224, 0.05);
    display: flex; flex-direction: column; gap: 12px;
  }
  .ws-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .ws-panel-title { font-size: 17px; font-weight: 700; color: #16243a; }
  .ws-warn { font-size: 13px; color: #a86a0c; background: rgba(244,185,66,0.12); padding: 10px 14px; border-radius: 10px; }
  .ws-copy { color: #2d7fe0; border-color: rgba(74, 158, 255, 0.35); padding: 8px 14px; }
  .ws-instructions {
    white-space: pre-wrap; font-family: inherit; font-size: 13px; line-height: 1.6; color: #3a4a62;
    background: rgba(74, 158, 255, 0.06); border-radius: 12px; padding: 14px 16px; margin: 0;
  }

  @media (max-width: 700px) {
    .ws-title { font-size: 24px; }
    .ws-avatar { width: 48px; height: 48px; font-size: 20px; }
  }
`;
