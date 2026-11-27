"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SCRAMBLE_THEME } from "@/lib/scramble-theme";
import type { ServiceKey } from "@/lib/tiers";
import ServiceMetricsCard, { ServiceData, SERVICE_CARD_STYLES } from "@/components/dashboard/ServiceMetricsCard";
import MetaShareSteps, { META_SHARE_STYLES } from "@/components/dashboard/MetaShareSteps";
import HeadlineMeasures, { HEADLINE_STYLES } from "@/components/dashboard/HeadlineMeasures";
import type { Headline } from "@/lib/client-metrics";
import type { PublicUpdate } from "@/lib/client-updates";
import { CLIENT_TABS_STYLES, ClientTab, OverviewTab, ReportsTab, TabBar, WorkTab } from "@/components/dashboard/ClientTabs";

export type DashboardMetrics = Partial<Record<"search_console" | "analytics" | "ads" | "meta_ads", ServiceData>> & {
  headline?: Headline | null;
};

/**
 * The client's dashboard, exactly as they see it. Used by the client's own
 * page and by the admin "View as client" preview, so the two can never drift.
 * `nav` is the top bar (sign out for the client, a preview banner for admins).
 */
export default function ClientDashboardView({
  companyName,
  services,
  metrics,
  updates,
  nav,
  preview = false,
}: {
  companyName: string;
  services: ServiceKey[];
  metrics: DashboardMetrics | null;
  /** Published updates only */
  updates: PublicUpdate[] | null;
  nav: React.ReactNode;
  preview?: boolean;
}) {
  const [tab, setTab] = useState<ClientTab>("overview");
  const [reportSub, setReportSub] = useState<"weekly" | "monthly">("weekly");
  const [metaOpen, setMetaOpen] = useState(false);

  // Escape closes the Meta setup window
  useEffect(() => {
    if (!metaOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMetaOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [metaOpen]);

  // Meta is read through the ad account the client shared with Scramble and an admin assigned
  const hasMeta = services.includes("meta_ads");
  const metaStatus = metrics?.meta_ads?.status;
  const metaConnected = !!metaStatus && metaStatus !== "not_set_up";

  return (
    <div className="sc-root">
      <style>{SCRAMBLE_THEME}</style>
      <style>{dashStyles}</style>
      <style>{SERVICE_CARD_STYLES}</style>
      <style>{META_SHARE_STYLES}</style>
      <style>{HEADLINE_STYLES}</style>
      <style>{CLIENT_TABS_STYLES}</style>

      {nav}

      <div className="dash-wrap">
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Welcome back, {companyName}</h1>
            <p className="dash-subtitle">Your marketing over the last 28 days, compared with the 28 days before.</p>
          </div>
          {hasMeta && metrics && (
            <div className="dash-conn-group">
              {metaConnected ? (
                <div className="dash-conn on">
                  <span className="dash-conn-dot" />
                  Meta Connected
                </div>
              ) : (
                <button type="button" className="dash-conn off dash-conn-btn" onClick={() => setMetaOpen(true)} aria-haspopup="dialog">
                  <span className="dash-conn-dot" />
                  Meta not connected
                  <span className="dash-conn-cta">Set up →</span>
                </button>
              )}
            </div>
          )}
        </div>

        <HeadlineMeasures headline={metrics?.headline} />

        <TabBar tab={tab} onChange={setTab} />

        {tab === "overview" && <OverviewTab updates={updates} />}
        {tab === "reports" && <ReportsTab sub={reportSub} onSub={setReportSub} />}
        {tab === "work" && <WorkTab />}
        {tab === "live" && (
          <div className="dash-services">
            {services.map((service) => (
              <ServiceMetricsCard key={service} service={service} data={metrics?.[service] ?? (metrics ? null : undefined)} />
            ))}
          </div>
        )}

        {metaOpen && (
          <div className="dash-modal-backdrop" onClick={() => setMetaOpen(false)}>
            <div className="dash-modal" role="dialog" aria-modal="true" aria-labelledby="meta-setup-title" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="dash-modal-close" aria-label="Close" onClick={() => setMetaOpen(false)}>×</button>
              <h2 id="meta-setup-title" className="dash-modal-title">Share your Meta ad account</h2>
              <p className="dash-modal-sub">
                See ad spend, clicks, conversions and ROAS for your Facebook and Instagram ads. You stay in control and can
                remove our access at any time.
              </p>
              <MetaShareSteps />
            </div>
          </div>
        )}

        {!preview && (
          <div className="dash-footer-links">
            <Link href="/dashboard/settings" className="sc-link">Account, billing & data access →</Link>
          </div>
        )}
      </div>
    </div>
  );
}

const dashStyles = `
  .dash-company { font-size: 15px; font-weight: 600; color: #4a5a72; }
  .dash-signout {
    background: rgba(74, 158, 255, 0.1); color: #2d7fe0; border: none;
    padding: 8px 16px; border-radius: 10px; font-size: 14px; font-weight: 600;
    cursor: pointer; font-family: inherit; transition: all 0.2s;
  }
  .dash-signout:hover { background: rgba(74, 158, 255, 0.18); }

  .dash-wrap { max-width: 1080px; margin: 0 auto; padding: 120px 28px 80px; }
  .dash-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
  .dash-title { font-size: 34px; font-weight: 800; letter-spacing: -1px; margin-bottom: 6px; }
  .dash-subtitle { font-size: 16px; color: #5a6b82; }
  .dash-conn-group { display: flex; gap: 10px; flex-wrap: wrap; }
  .dash-conn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 9px 16px; border-radius: 999px; font-size: 14px; font-weight: 600;
  }
  .dash-conn.on { background: rgba(52, 199, 123, 0.12); color: #1a8a4f; }
  .dash-conn.off { background: rgba(255, 138, 128, 0.12); color: #c0392b; }
  .dash-conn-btn { border: 1px solid rgba(192, 57, 43, 0.25); cursor: pointer; font-family: inherit; transition: all 0.2s; }
  .dash-conn-btn:hover { background: rgba(255, 138, 128, 0.22); transform: translateY(-1px); }
  .dash-conn-cta { font-weight: 800; margin-left: 2px; }
  .dash-modal-backdrop { position: fixed; inset: 0; background: rgba(16, 30, 52, 0.45); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .dash-modal { position: relative; background: white; border-radius: 22px; padding: 30px 32px; max-width: 560px; width: 100%; max-height: 88vh; overflow-y: auto; box-shadow: 0 24px 60px rgba(16, 30, 52, 0.3); }
  .dash-modal-title { font-size: 22px; font-weight: 800; color: #16243a; margin: 0 28px 6px 0; }
  .dash-modal-sub { font-size: 14px; color: #5a6b82; line-height: 1.55; margin: 0 0 4px; }
  .dash-modal-close { position: absolute; top: 14px; right: 16px; width: 36px; height: 36px; border-radius: 50%; border: none; background: rgba(74,158,255,0.1); color: #2d7fe0; font-size: 24px; line-height: 1; cursor: pointer; }
  .dash-conn-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
  .dash-conn-disconnect {
    background: rgba(0,0,0,0.08); border: none; color: inherit; font-size: 12px; font-weight: 700;
    padding: 3px 10px; border-radius: 999px; margin-left: 2px; cursor: pointer; font-family: inherit;
    transition: background 0.15s;
  }
  .dash-conn-disconnect:hover { background: rgba(0,0,0,0.16); }
  .dash-conn-disconnect:disabled { opacity: 0.6; cursor: default; }

  .dash-connect-banner {
    display: flex; align-items: center; justify-content: space-between; gap: 20px;
    padding: 24px 28px; border-radius: 18px; margin-bottom: 28px; flex-wrap: wrap;
    background: linear-gradient(135deg, rgba(74,158,255,0.1), rgba(244,185,66,0.1));
    border: 1px solid rgba(122, 178, 255, 0.25);
  }
  .dash-connect-banner h3 { font-size: 18px; font-weight: 700; color: #16243a; margin-bottom: 4px; }
  .dash-connect-banner p { font-size: 14px; color: #5a6b82; }
  .dash-connect-btn {
    flex-shrink: 0; text-decoration: none; color: white; font-weight: 700; font-size: 15px;
    padding: 12px 22px; border-radius: 12px;
    background: linear-gradient(135deg, #4a9eff 0%, #2d7fe0 100%);
    box-shadow: 0 8px 20px rgba(74, 158, 255, 0.35);
    transition: all 0.3s;
  }
  .dash-connect-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(74, 158, 255, 0.45); }

  .dash-connect-meta {
    background: linear-gradient(135deg, rgba(24,119,242,0.08), rgba(66,103,178,0.08));
    border: 1px solid rgba(24,119,242,0.2);
  }
  .dash-connect-btn-meta {
    background: linear-gradient(135deg, #1877F2 0%, #1565C0 100%);
    box-shadow: 0 8px 20px rgba(24, 119, 242, 0.35);
  }
  .dash-connect-btn-meta:hover { box-shadow: 0 12px 28px rgba(24, 119, 242, 0.45); }

  .dash-services { display: flex; flex-direction: column; gap: 24px; }
  .dash-footer-links { text-align: center; margin-top: 40px; }

  @media (max-width: 700px) {
    .dash-title { font-size: 26px; }
  }
`;

export const PREVIEW_BAR_STYLES = `
  .pv-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; width: 100%; }
  .pv-note { font-size: 14px; font-weight: 600; color: #7a4d00; background: rgba(244,185,66,0.2); padding: 8px 14px; border-radius: 10px; }
  .pv-back { font-size: 14px; font-weight: 700; }
`;
