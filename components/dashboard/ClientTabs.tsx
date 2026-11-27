"use client";

import { PublicUpdate, UPDATE_KINDS, UpdateKind } from "@/lib/client-updates";

// Tab bar and the Overview / Reports / Work in progress tab bodies of the
// client dashboard. Everything shown here is content the Scramble team has
// published; the Live data tab (the service cards) is rendered by the page.

export type ClientTab = "overview" | "reports" | "live" | "work";

export const CLIENT_TABS: [ClientTab, string][] = [
  ["overview", "Overview"],
  ["reports", "Reports"],
  ["live", "Live data"],
  ["work", "Work in progress"],
];

export function TabBar({ tab, onChange }: { tab: ClientTab; onChange: (t: ClientTab) => void }) {
  return (
    <div className="ct-bar" role="tablist" aria-label="Dashboard sections">
      {CLIENT_TABS.map(([key, label]) => (
        <button key={key} role="tab" aria-selected={tab === key} className={`ct-tab ${tab === key ? "on" : ""}`} onClick={() => onChange(key)}>
          {label}
        </button>
      ))}
    </div>
  );
}

const SECTIONS: { kind: UpdateKind; title: string; empty: string }[] = [
  { kind: "win", title: "Wins this month", empty: "Your Scramble team will share your wins here as they happen." },
  { kind: "done", title: "What we did", empty: "A summary of the work we’ve completed will appear here." },
  { kind: "next", title: "What’s next", empty: "Your Scramble team will share what’s coming up here." },
];

const when = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export function OverviewTab({ updates }: { updates: PublicUpdate[] | null }) {
  if (updates === null) return <p className="ct-muted">Loading…</p>;
  return (
    <div className="ct-grid">
      {SECTIONS.map((s) => {
        const items = updates.filter((u) => u.kind === s.kind);
        return (
          <section className="ct-card" key={s.kind} aria-label={UPDATE_KINDS[s.kind]}>
            <h2 className="ct-card-title">{s.title}</h2>
            {items.length === 0 ? (
              <p className="ct-muted">{s.empty}</p>
            ) : (
              <ul className="ct-list">
                {items.map((u) => (
                  <li key={u.id}>
                    <span>{u.body}</span>
                    <span className="ct-when">{when(u.published_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

/** Weekly and monthly reports. The reports themselves arrive in the next release. */
export function ReportsTab({ sub, onSub }: { sub: "weekly" | "monthly"; onSub: (s: "weekly" | "monthly") => void }) {
  return (
    <>
      <div className="ct-sub" role="tablist" aria-label="Report type">
        {(["weekly", "monthly"] as const).map((k) => (
          <button key={k} role="tab" aria-selected={sub === k} className={`ct-subtab ${sub === k ? "on" : ""}`} onClick={() => onSub(k)}>
            {k === "weekly" ? "Weekly" : "Monthly"}
          </button>
        ))}
      </div>
      <section className="ct-card">
        <h2 className="ct-card-title">{sub === "weekly" ? "Weekly summaries" : "Monthly reports"}</h2>
        <p className="ct-muted">
          {sub === "weekly"
            ? "A short summary of your week will appear here every week."
            : "A fuller report with the work we completed and what’s next will appear here each month."}
        </p>
      </section>
    </>
  );
}

export function WorkTab() {
  return (
    <section className="ct-card">
      <h2 className="ct-card-title">Work in progress</h2>
      <p className="ct-muted">What we’re working on for you, and where it’s up to, will appear here.</p>
    </section>
  );
}

export const CLIENT_TABS_STYLES = `
  .ct-bar { display: flex; gap: 4px; margin: 0 0 20px; border-bottom: 1px solid rgba(122,178,255,0.25); overflow-x: auto; }
  .ct-tab { padding: 12px 18px; background: none; border: none; border-bottom: 3px solid transparent; font-family: inherit; font-size: 15px; font-weight: 700; color: #8a97ab; cursor: pointer; white-space: nowrap; margin-bottom: -1px; }
  .ct-tab.on { color: #2d7fe0; border-bottom-color: #2d7fe0; }
  .ct-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px; }
  .ct-card { background: rgba(255,255,255,0.94); border: 1px solid rgba(122,178,255,0.18); border-radius: 20px; padding: 22px 24px; box-shadow: 0 10px 28px rgba(45,127,224,0.06); }
  .ct-card-title { font-size: 18px; font-weight: 800; color: #16243a; margin: 0 0 12px; }
  .ct-muted { font-size: 15px; color: #8a97ab; line-height: 1.6; margin: 0; }
  .ct-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
  .ct-list li { display: flex; flex-direction: column; gap: 2px; font-size: 15px; color: #3a4a62; line-height: 1.5; }
  .ct-when { font-size: 12px; color: #8a97ab; }
  .ct-sub { display: flex; gap: 8px; margin-bottom: 16px; }
  .ct-subtab { padding: 8px 16px; border-radius: 999px; border: 1px solid rgba(122,178,255,0.3); background: white; color: #4a5a72; font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
  .ct-subtab.on { background: #2d7fe0; border-color: #2d7fe0; color: white; }
`;
