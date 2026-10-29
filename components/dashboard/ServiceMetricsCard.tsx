"use client";

import { SERVICE_META, ServiceKey } from "@/lib/tiers";

// One service's metrics card. Used on the client dashboard and in the admin
// client workspace, so admins see exactly what the client sees.

export interface Metric {
  label: string;
  current: number;
  previous: number;
  format: "number" | "currency" | "duration" | "position" | "multiplier";
  currency?: string;
  lowerIsBetter?: boolean;
}

export type ServiceData =
  | { status: "ok"; period: { start: string; end: string }; metrics: Metric[] }
  | { status: "not_set_up" }
  | { status: "unavailable" }
  | null;


/* ─── Per-service dashboard card ─── */

export default function ServiceMetricsCard({
  service,
  data,
  metaConnected,
}: {
  service: ServiceKey;
  /** undefined while loading (or Meta); null if not in the response */
  data: ServiceData | undefined;
  metaConnected: boolean;
}) {
  const meta = SERVICE_META[service];

  let body: React.ReactNode;
  if (service === "meta_ads") {
    body = (
      <div className="service-dash-locked">
        {metaConnected
          ? "Your Meta account is connected. Facebook & Instagram results will appear here soon."
          : "🔒 Connect Meta to unlock Facebook & Instagram Ads data"}
      </div>
    );
  } else if (data === undefined) {
    body = <div className="service-dash-locked">Loading your data…</div>;
  } else if (!data || data.status === "not_set_up") {
    body = (
      <div className="service-dash-locked">
        Your Scramble team is setting this up. Your {meta.label} data will appear here once it&apos;s connected.
      </div>
    );
  } else if (data.status === "unavailable") {
    body = (
      <div className="service-dash-locked">
        We couldn&apos;t load your {meta.label} data just now. Please check back later, or contact your Scramble team if this continues.
      </div>
    );
  } else {
    body = (
      <>
        <div className="service-dash-stats">
          {data.metrics.map((m) => {
            const trend = formatTrend(m);
            return (
              <div className="service-stat" key={m.label}>
                <div className="service-stat-label">{m.label}</div>
                <div className="service-stat-value">{formatValue(m, m.current)}</div>
                {trend && <div className={`service-stat-trend ${trend.good ? "up" : "down"}`}>{trend.text}</div>}
              </div>
            );
          })}
        </div>
        <p className="service-dash-period">
          {formatDate(data.period.start)} – {formatDate(data.period.end)}
        </p>
      </>
    );
  }

  return (
    <div className="service-dash">
      <div className="service-dash-head">
        <div className="service-dash-icon">{meta.icon}</div>
        <div>
          <h2 className="service-dash-title">{meta.label}</h2>
          <p className="service-dash-desc">{meta.desc}</p>
        </div>
      </div>
      {body}
    </div>
  );
}

function formatValue(m: Metric, v: number): string {
  switch (m.format) {
    case "currency":
      return new Intl.NumberFormat("en-GB", { style: "currency", currency: m.currency || "GBP", maximumFractionDigits: 0 }).format(v);
    case "duration": {
      const mins = Math.floor(v / 60);
      const secs = Math.round(v % 60);
      return mins ? `${mins}m ${secs}s` : `${secs}s`;
    }
    case "position":
      return v ? v.toFixed(1) : "—";
    case "multiplier":
      return `${v.toFixed(1)}x`;
    default:
      return new Intl.NumberFormat("en-GB", { maximumFractionDigits: v < 100 ? 1 : 0 }).format(v);
  }
}

function formatTrend(m: Metric): { text: string; good: boolean } | null {
  if (!m.previous || !m.current) return null;
  const change = m.current - m.previous;
  if (change === 0) return null;
  const up = change > 0;
  const good = m.lowerIsBetter ? !up : up;
  const text =
    m.format === "position" || m.format === "multiplier"
      ? `${Math.abs(change).toFixed(1)}`
      : `${Math.abs((change / m.previous) * 100).toFixed(1)}%`;
  return { text: `${up ? "▲" : "▼"} ${text}`, good };
}

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export const SERVICE_CARD_STYLES = `
  .service-dash {
    background: rgba(255,255,255,0.92); backdrop-filter: blur(16px);
    border: 1px solid rgba(122, 178, 255, 0.16); border-radius: 22px; padding: 28px;
    box-shadow: 0 14px 36px rgba(45, 127, 224, 0.07), inset 0 1px 0 rgba(255,255,255,0.9);
  }
  .service-dash-head { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
  .service-dash-icon {
    width: 52px; height: 52px; border-radius: 15px;
    display: flex; align-items: center; justify-content: center; font-size: 26px;
    background: linear-gradient(135deg, rgba(122,178,255,0.2), rgba(74,158,255,0.12));
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
  }
  .service-dash-title { font-size: 20px; font-weight: 700; color: #16243a; }
  .service-dash-desc { font-size: 14px; color: #8a97ab; }

  .service-dash-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .service-stat {
    padding: 18px; border-radius: 14px;
    background: rgba(74, 158, 255, 0.04);
    border: 1px solid rgba(122, 178, 255, 0.12);
  }
  .service-stat-label { font-size: 13px; color: #8a97ab; font-weight: 500; margin-bottom: 8px; }
  .service-stat-value { font-size: 28px; font-weight: 800; color: #16243a; letter-spacing: -1px; }
  .service-stat-trend { font-size: 13px; font-weight: 700; margin-top: 6px; }
  .service-stat-trend.up { color: #34c77b; }
  .service-stat-trend.down { color: #e74c3c; }

  .service-dash-period { margin-top: 14px; font-size: 13px; color: #8a97ab; }

  .service-dash-locked {
    margin-top: 20px; padding: 14px; border-radius: 12px; text-align: center;
    background: rgba(122, 178, 255, 0.08); color: #5a6b82; font-size: 14px; font-weight: 500;
  }

  @media (max-width: 700px) {
    .service-dash-stats { grid-template-columns: 1fr; }
  }
`;
