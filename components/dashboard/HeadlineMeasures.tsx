"use client";

import type { Headline, HeadlineMeasure } from "@/lib/client-metrics";

// The success measures at the top of the client dashboard. Shared by the
// client's own dashboard and the admin workspace, so both see the same thing.

function formatValue(m: HeadlineMeasure, v: number) {
  if (m.format === "currency") {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: m.currency || "GBP", maximumFractionDigits: 0 }).format(v);
  }
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: v < 100 ? 1 : 0 }).format(v);
}

function trendOf(m: HeadlineMeasure): { text: string; tone: "up" | "down" | "flat" } | null {
  if (!m.trend) return null;
  // Prefer "since we started" once we have a week or more of history
  if (m.baseline !== null && m.baseline !== m.value) {
    const diff = m.value - m.baseline;
    const sign = diff > 0 ? "+" : "−";
    return { text: `${sign}${formatValue(m, Math.abs(diff))} since we started`, tone: diff > 0 ? "up" : "down" };
  }
  if (m.previous && m.previous !== m.value) {
    const pct = Math.round(((m.value - m.previous) / m.previous) * 100);
    if (pct === 0) return null;
    return { text: `${pct > 0 ? "+" : "−"}${Math.abs(pct)}% vs the 28 days before`, tone: pct > 0 ? "up" : "down" };
  }
  return null;
}

export default function HeadlineMeasures({ headline }: { headline: Headline | null | undefined }) {
  if (!headline || headline.measures.length === 0) return null;
  const since = headline.trackingSince
    ? new Date(headline.trackingSince).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <section className="hm" aria-label="Your success measures">
      <p className="hm-sub">
        The last 28 days{since ? ` · tracking since ${since}` : ""}
      </p>
      <div className="hm-grid">
        {headline.measures.map((m) => {
          const t = trendOf(m);
          return (
            <div className="hm-card" key={m.key}>
              <div className="hm-label">{m.label}</div>
              <div className="hm-value">{formatValue(m, m.value)}</div>
              {t ? (
                <div className={`hm-trend ${t.tone}`}>{t.text}</div>
              ) : m.note ? (
                <div className="hm-trend flat">{m.note}</div>
              ) : (
                <div className="hm-trend flat">&nbsp;</div>
              )}
              {t && m.note && <div className="hm-note">{m.note}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export const HEADLINE_STYLES = `
  .hm { margin-bottom: 32px; }
  .hm-sub { font-size: 14px; color: #8a97ab; margin: 0 0 12px; }
  .hm-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; }
  .hm-card {
    background: rgba(255,255,255,0.94); border: 1px solid rgba(122, 178, 255, 0.2);
    border-radius: 18px; padding: 18px 20px; box-shadow: 0 8px 24px rgba(45, 127, 224, 0.06);
  }
  .hm-label { font-size: 14px; font-weight: 600; color: #5a6b82; }
  .hm-value { font-size: 34px; font-weight: 800; letter-spacing: -1px; color: #16243a; margin: 4px 0 2px; }
  .hm-trend { font-size: 13px; font-weight: 600; }
  .hm-trend.up { color: #1a8a4f; }
  .hm-trend.down { color: #c0392b; }
  .hm-trend.flat { color: #8a97ab; }
  .hm-note { font-size: 12px; color: #8a97ab; margin-top: 2px; }
`;
