"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { FileText, ChevronDown, ChevronUp, Calendar, CheckCircle, Clock } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";

interface WeeklyReport {
  id: string;
  client_email: string;
  period_start: string;
  period_end: string;
  report_type: string;
  summary: string;
  highlights: Record<string, number | null>;
  top_keywords: Array<{ query: string; clicks: number; impressions: number }>;
  report_html: string;
  status: string;
  created_at: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PeriodLabel({ start, end }: { start: string; end: string }) {
  return (
    <span className="text-sm font-medium" style={{ color: "#a8a89d" }}>
      {formatDate(start)} – {formatDate(end)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isDelivered = status === "delivered";
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{
        background: isDelivered ? "rgba(34,197,94,0.15)" : "rgba(99,102,241,0.15)",
        color: isDelivered ? "#22c55e" : "#818cf8",
      }}
    >
      {isDelivered ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {isDelivered ? "Delivered" : "Generated"}
    </span>
  );
}

function ReportCard({ report }: { report: WeeklyReport }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 flex-shrink-0" style={{ color: "#6b8e7f" }} />
            <PeriodLabel start={report.period_start} end={report.period_end} />
          </div>
          <StatusBadge status={report.status} />
        </div>

        {/* Summary */}
        <p className="text-sm leading-relaxed mb-4" style={{ color: "#c8c8c0" }}>
          {report.summary?.split("\n")[0]}
        </p>

        {/* Key metrics row */}
        {report.highlights && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {report.highlights.sc_clicks != null && (
              <div className="text-center p-2.5 rounded-xl" style={{ background: "rgba(107,142,127,0.1)" }}>
                <p className="text-lg font-bold" style={{ color: "#f5f5f0" }}>{report.highlights.sc_clicks}</p>
                <p className="text-xs" style={{ color: "#a8a89d" }}>Organic Clicks</p>
              </div>
            )}
            {report.highlights.sc_impressions != null && (
              <div className="text-center p-2.5 rounded-xl" style={{ background: "rgba(107,142,127,0.1)" }}>
                <p className="text-lg font-bold" style={{ color: "#f5f5f0" }}>{(report.highlights.sc_impressions as number).toLocaleString()}</p>
                <p className="text-xs" style={{ color: "#a8a89d" }}>Impressions</p>
              </div>
            )}
            {report.highlights.ga_sessions != null && (
              <div className="text-center p-2.5 rounded-xl" style={{ background: "rgba(107,142,127,0.1)" }}>
                <p className="text-lg font-bold" style={{ color: "#f5f5f0" }}>{report.highlights.ga_sessions}</p>
                <p className="text-xs" style={{ color: "#a8a89d" }}>Sessions</p>
              </div>
            )}
            {report.highlights.ga_users != null && (
              <div className="text-center p-2.5 rounded-xl" style={{ background: "rgba(107,142,127,0.1)" }}>
                <p className="text-lg font-bold" style={{ color: "#f5f5f0" }}>{report.highlights.ga_users}</p>
                <p className="text-xs" style={{ color: "#a8a89d" }}>Users</p>
              </div>
            )}
          </div>
        )}

        {/* Expand button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{
            background: expanded ? "rgba(107,142,127,0.15)" : "rgba(255,255,255,0.05)",
            color: "#a8a89d",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide Full Report
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              View Full Report
            </>
          )}
        </button>
      </div>

      {/* Full report HTML */}
      {expanded && report.report_html && (
        <div
          className="px-5 pb-5 border-t"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <style>{`
            .report-content { padding-top: 1.25rem; }
            .report-period { font-size: 0.75rem; font-weight: 600; color: #a8a89d; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; }
            .report-section { margin-bottom: 1.5rem; }
            .report-section h3 { font-size: 0.875rem; font-weight: 700; color: #f5f5f0; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
            .report-section h4 { font-size: 0.75rem; font-weight: 600; color: #a8a89d; text-transform: uppercase; letter-spacing: 0.05em; margin: 1rem 0 0.5rem; }
            .report-section p { font-size: 0.875rem; color: #c8c8c0; line-height: 1.6; }
            .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
            .metric { background: rgba(107,142,127,0.1); border-radius: 0.75rem; padding: 0.875rem; text-align: center; }
            .metric .value { display: block; font-size: 1.5rem; font-weight: 700; color: #f5f5f0; }
            .metric .label { display: block; font-size: 0.7rem; color: #a8a89d; margin-top: 0.25rem; }
            .keywords-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
            .keywords-table th { text-align: left; padding: 0.5rem 0.75rem; color: #a8a89d; font-weight: 600; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid rgba(255,255,255,0.06); }
            .keywords-table td { padding: 0.5rem 0.75rem; color: #c8c8c0; border-bottom: 1px solid rgba(255,255,255,0.04); }
            .report-footer { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.06); }
            .report-footer p { font-size: 0.75rem; color: #7a7a70; }
          `}</style>
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(report.report_html, { ALLOWED_TAGS: ['div','span','p','h1','h2','h3','h4','h5','h6','table','thead','tbody','tr','th','td','ul','ol','li','strong','em','br','a','img','section','header','footer'], ALLOWED_ATTR: ['class','style','href','src','alt','width','height','target','rel'] }) }} />
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await authClient.auth.getUser();
      if (!user?.email) {
        router.replace("/landing");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("weekly_reports")
        .select("*")
        .eq("client_email", user.email)
        .order("period_start", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setReports(data || []);
      }
      setLoading(false);
    })();
  }, [router]);

  return (
    <section
      className="min-h-screen pt-28 pb-20 px-6"
      style={{ background: "#1a2e2a" }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(107,142,127,0.2)" }}
            >
              <Calendar className="w-5 h-5" style={{ color: "#6b8e7f" }} />
            </div>
            <h1 className="text-3xl font-extrabold" style={{ color: "#f5f5f0" }}>
              Reports
            </h1>
          </div>
          <p className="text-sm" style={{ color: "#a8a89d" }}>
            Weekly performance reports for your website — generated every Monday.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSpinner text="Loading your reports…" />
        ) : error ? (
          <div
            className="p-5 rounded-2xl text-sm"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#f87171",
            }}
          >
            Failed to load reports: {error}
          </div>
        ) : reports.length === 0 ? (
          <div
            className="text-center py-20 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px dashed rgba(255,255,255,0.1)",
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(107,142,127,0.1)" }}
            >
              <FileText className="w-8 h-8" style={{ color: "#6b8e7f" }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#f5f5f0" }}>
              No reports yet
            </h2>
            <p className="text-sm max-w-xs mx-auto" style={{ color: "#a8a89d" }}>
              Your first report will be ready next Monday, once we&apos;ve collected a
              week of data from your Google accounts.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
