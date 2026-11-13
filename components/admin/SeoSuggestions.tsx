"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api-client";
import { SEO_KINDS, SeoKind } from "@/lib/seo-analysis";
import TeamMemberPicker, { TeamMember } from "./TeamMemberPicker";

type SeoStatus = "new" | "accepted" | "done" | "dismissed";

interface Suggestion {
  id: string;
  kind: SeoKind;
  subject: string;
  summary: string;
  recommendation: string;
  evidence: Record<string, number | string>;
  last_seen_at: string;
  status: SeoStatus;
  status_by: string | null;
}

const KIND_ORDER: SeoKind[] = ["near_page_one", "low_ctr", "declining", "low_engagement"];
const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** SEO suggestions for one client: run the analysis, then work through the list. */
export default function SeoSuggestions({
  clientId,
  member,
  onMemberChange,
}: {
  clientId: string;
  member: TeamMember | null;
  onMemberChange: (m: TeamMember) => void;
}) {
  const [items, setItems] = useState<Suggestion[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState<"open" | "done" | "dismissed">("open");

  const load = () =>
    authFetch(`/api/admin/clients/${clientId}/seo`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setItems(d.suggestions))
      .catch(() => {
        setLoadError(true);
        setItems([]);
      });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const run = async () => {
    setRunning(true);
    setError("");
    setMessage("");
    const res = await authFetch(`/api/admin/clients/${clientId}/seo`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setRunning(false);
    if (!res.ok) return setError(data.error || "The analysis didn't run.");
    setMessage(
      `${data.found} suggestion${data.found === 1 ? "" : "s"} found.` + (data.skipped?.length ? ` Skipped: ${data.skipped.join("; ")}.` : "")
    );
    await load();
  };

  const setStatus = async (id: string, status: SeoStatus) => {
    if (!member) return setError("Choose who you are first.");
    setError("");
    const res = await authFetch(`/api/admin/seo/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, by: member }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error || "Couldn't update.");
    setItems((list) => (list || []).map((x) => (x.id === id ? { ...x, status, status_by: member } : x)));
  };

  const visible = (items || []).filter((i) =>
    show === "open" ? i.status === "new" || i.status === "accepted" : i.status === show
  );
  const lastRun = (items || []).reduce<string | null>((m, i) => (!m || i.last_seen_at > m ? i.last_seen_at : m), null);

  return (
    <div className="seo">
      <p className="ws-help">
        Opportunities found in this client&apos;s Search Console and Analytics data. The analysis only reads data and
        proposes ideas. It doesn&apos;t change the client&apos;s website.
      </p>

      <div className="ws-panel">
        <div className="seo-bar">
          <div>
            <button onClick={run} disabled={running} className="agency-btn-primary">
              {running ? "Analysing…" : "Run analysis"}
            </button>
            {lastRun && <span className="seo-last"> Last updated {fmt(lastRun)}</span>}
          </div>
          <TeamMemberPicker member={member} onChange={onMemberChange} />
        </div>
        {message && <div className="sc-success">{message}</div>}
        {error && <div className="sc-error">{error}</div>}
      </div>

      <div className="hub-filters">
        {([["open", "Open"], ["done", "Done"], ["dismissed", "Dismissed"]] as const).map(([k, label]) => (
          <button key={k} className={`hub-filter ${show === k ? "on" : ""}`} onClick={() => setShow(k)}>{label}</button>
        ))}
      </div>

      {items === null ? (
        <p className="ws-help">Loading…</p>
      ) : loadError ? (
        <div className="sc-error">Couldn&apos;t load suggestions. Refresh to try again.</div>
      ) : visible.length === 0 ? (
        <p className="ws-help">
          {items.length === 0 ? "No suggestions yet. Press Run analysis." : "Nothing here."}
        </p>
      ) : (
        KIND_ORDER.map((kind) => {
          const group = visible.filter((i) => i.kind === kind);
          if (group.length === 0) return null;
          return (
            <section key={kind} className="seo-group">
              <h3 className="seo-group-title">{SEO_KINDS[kind].label} <span>({group.length})</span></h3>
              <p className="ws-help">{SEO_KINDS[kind].help}</p>
              <ul className="seo-list">
                {group.map((i) => (
                  <li key={i.id} className="seo-item">
                    <p className="seo-summary">{i.summary}</p>
                    <p className="seo-rec"><strong>Suggested:</strong> {i.recommendation}</p>
                    <div className="seo-meta">
                      {Object.entries(i.evidence).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(" · ")}
                      {i.status !== "new" && <> · {i.status}{i.status_by ? ` by ${i.status_by}` : ""}</>}
                    </div>
                    <div className="seo-actions">
                      {i.status === "new" && <button className="agency-btn-primary" onClick={() => setStatus(i.id, "accepted")}>Accept</button>}
                      {(i.status === "new" || i.status === "accepted") && <button className="agency-btn-primary" onClick={() => setStatus(i.id, "done")}>Mark done</button>}
                      {(i.status === "new" || i.status === "accepted") && <button className="agency-btn-ghost" onClick={() => setStatus(i.id, "dismissed")}>Dismiss</button>}
                      {(i.status === "done" || i.status === "dismissed") && <button className="agency-btn-ghost" onClick={() => setStatus(i.id, "new")}>Reopen</button>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}

export const SEO_STYLES = `
  .seo { display: flex; flex-direction: column; gap: 18px; }
  .seo-bar { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
  .seo-last { font-size: 13px; color: #8a97ab; margin-left: 10px; }
  .seo-group-title { font-size: 17px; font-weight: 700; color: #16243a; }
  .seo-group-title span { color: #8a97ab; font-weight: 600; }
  .seo-list { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
  .seo-item { background: rgba(255,255,255,0.94); border: 1px solid rgba(122, 178, 255, 0.18); border-radius: 16px; padding: 16px 18px; }
  .seo-summary { font-size: 15px; color: #16243a; line-height: 1.5; margin: 0 0 6px; }
  .seo-rec { font-size: 14px; color: #3a4a62; line-height: 1.5; margin: 0 0 6px; }
  .seo-meta { font-size: 12px; color: #8a97ab; }
  .seo-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
`;
