"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  HelpCircle,
  Zap,
  LogOut,
  LogIn,
} from "lucide-react";
import StatusDot from "@/components/ui/StatusDot";
import Badge from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { authFetch } from "@/lib/api-client";

interface ServiceHealth {
  service: string;
  connectionId: string;
  status: "ok" | "error" | "unknown";
  message?: string;
  latencyMs?: number;
}

interface HealthResponse {
  overall: "ok" | "degraded" | "error";
  checkedAt: string;
  services: ServiceHealth[];
}

interface OAuthStatus {
  connected: boolean;
  email: string | null;
  scopes: string[];
  isExpired: boolean;
  lastUsed: string | null;
  hasScopes: {
    searchConsole: boolean;
    analyticsReadonly: boolean;
    analyticsManage: boolean;
    ads: boolean;
  };
}

const CONNECTION_INFO: Record<string, { icon: string; description: string }> = {
  "Google Search Console": { icon: "🔍", description: "Keyword rankings, impressions & clicks" },
  "Google Analytics Admin": { icon: "📊", description: "Property & account management" },
  "Google Analytics Data": { icon: "📈", description: "Traffic, sessions & user data" },
  "Google Ads": { icon: "💰", description: "Campaign spend & conversions" },
};

const DEFAULT_SERVICES: ServiceHealth[] = [
  { service: "Google Search Console", connectionId: "gsc", status: "unknown" },
  { service: "Google Analytics Admin", connectionId: "ga-admin", status: "unknown" },
  { service: "Google Analytics Data", connectionId: "ga-data", status: "unknown" },
  { service: "Google Ads", connectionId: "gads", status: "unknown" },
];

function StatusIcon({ status }: { status: "ok" | "error" | "unknown" }) {
  if (status === "ok") return <CheckCircle className="w-5 h-5 text-green-500" />;
  if (status === "error") return <XCircle className="w-5 h-5 text-red-500" />;
  return <HelpCircle className="w-5 h-5" style={{ color: "#7a7a70" }} />;
}

export default function SettingsPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [oauthStatus, setOauthStatus] = useState<OAuthStatus | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [clientId, setClientId] = useState<string>("");

  // Get clientId from URL or session
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cid = params.get("clientId") || "default-client";
    setClientId(cid);
    checkOAuthStatus(cid);
  }, []);

  const checkOAuthStatus = async (cid: string) => {
    try {
      const res = await authFetch(`/api/auth/google/status?clientId=${encodeURIComponent(cid)}`);
      const data = await res.json();
      setOauthStatus(data);
    } catch (error) {
      console.error("Failed to check OAuth status:", error);
    }
  };

  const handleConnectGoogle = async () => {
    setOauthLoading(true);
    try {
      const res = await fetch("/api/auth/google/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error("Failed to initiate OAuth:", error);
      alert("Failed to start Google login. Please try again.");
    } finally {
      setOauthLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect your Google account? You'll need to reconnect to sync data.")) {
      return;
    }
    setOauthLoading(true);
    try {
      const res = await authFetch("/api/auth/google/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      if (res.ok) {
        setOauthStatus(null);
        await checkOAuthStatus(clientId);
      } else {
        alert("Failed to disconnect. Please try again.");
      }
    } catch (error) {
      console.error("Failed to disconnect:", error);
      alert("Failed to disconnect. Please try again.");
    } finally {
      setOauthLoading(false);
    }
  };

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data);
      setChecked(true);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const overallBadge =
    health?.overall === "ok" ? "green" :
    health?.overall === "degraded" ? "amber" : "red";

  const services = health?.services ?? DEFAULT_SERVICES;

  return (
    <>
      {/* Header — centered hero */}
      <section
        className="text-center"
        style={{
          background: "linear-gradient(135deg, #1a2e2a 0%, #1f3a35 50%, #243633 100%)",
          paddingTop: "180px",
          paddingBottom: "64px",
        }}
      >
        <div className="max-w-2xl mx-auto px-6">
          <h1
            className="text-4xl font-extrabold mb-3"
            style={{ color: "#f5f5f0", letterSpacing: "-0.5px" }}
          >
            Settings
          </h1>
          <p className="text-lg" style={{ color: "#a8a89d" }}>
            Manage API connections and integrations
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-6" style={{ background: "#1a2e2a" }}>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* OAuth Section */}
          <div
            className="p-8 rounded-2xl"
            style={{
              background: "white",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 6px 16px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)",
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #4285f4 0%, #5a9fd4 100%)",
                    boxShadow: "0 2px 10px rgba(66, 133, 244, 0.25)",
                  }}
                >
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "#f5f5f0" }}>Google Account</h2>
                  <p className="text-sm" style={{ color: "#a8a89d" }}>
                    Connect your Google account to access Search Console, Analytics, and Ads data
                  </p>
                </div>
              </div>
            </div>

            {/* OAuth Status */}
            {oauthStatus?.connected ? (
              <div className="space-y-4">
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #86efac",
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-900">{oauthStatus.email}</span>
                  </div>
                  <p className="text-sm text-green-800">
                    {oauthStatus.hasScopes.searchConsole && "✓ Search Console "}
                    {oauthStatus.hasScopes.analyticsReadonly && "✓ Analytics "}
                    {oauthStatus.hasScopes.ads && "✓ Ads "}
                    {oauthStatus.isExpired && "(token expired, will refresh on next sync)"}
                  </p>
                </div>
                <button
                  onClick={handleDisconnect}
                  disabled={oauthLoading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm transition-all"
                  style={{
                    background: "#fee2e2",
                    color: "#991b1b",
                    border: "1px solid #fecaca",
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  {oauthLoading ? "Disconnecting..." : "Disconnect Google Account"}
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectGoogle}
                disabled={oauthLoading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm transition-all hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #4285f4 0%, #5a9fd4 100%)",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(66, 133, 244, 0.3)",
                }}
              >
                <LogIn className="w-4 h-4" />
                {oauthLoading ? "Opening Google Login..." : "Connect Google Account"}
              </button>
            )}
          </div>

          {/* Health Check Section */}
          <div
            className="p-8 rounded-2xl"
            style={{
              background: "white",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 6px 16px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)",
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #6b8e7f 0%, #7fa592 100%)",
                    boxShadow: "0 2px 10px rgba(8, 145, 178, 0.25)",
                  }}
                >
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "#f5f5f0" }}>API Connections</h2>
                  <p className="text-sm" style={{ color: "#a8a89d" }}>
                    Connect your Google account to pull live client data
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {health && (
                  <Badge variant={overallBadge}>
                    {health.overall === "ok" ? "All OK" : health.overall === "degraded" ? "Degraded" : "Error"}
                  </Badge>
                )}
                <button
                  onClick={checkHealth}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:-translate-y-0.5"
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    backdropFilter: "blur(10px)",
                    color: "#6b8e7f",
                    border: "1px solid rgba(8,145,178,0.2)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  {checked ? "Re-check" : "Check Status"}
                </button>
              </div>
            </div>

            {/* Services */}
            {loading && !health ? (
              <PageLoader text="Checking connections…" />
            ) : (
              <div className="space-y-3">
                {services.map((svc) => {
                  const info = CONNECTION_INFO[svc.service];
                  return (
                    <div
                      key={svc.connectionId}
                      className="flex items-center gap-5 p-5 rounded-xl transition-all"
                      style={{
                        background: "#1a2e2a",
                        border: "1px solid rgba(0,0,0,0.04)",
                      }}
                    >
                      <span className="text-2xl flex-shrink-0">{info?.icon ?? "🔗"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold" style={{ color: "#f5f5f0" }}>{svc.service}</p>
                          <StatusIcon status={svc.status} />
                          {svc.latencyMs !== undefined && (
                            <span className="text-xs" style={{ color: "#7a7a70" }}>{svc.latencyMs}ms</span>
                          )}
                        </div>
                        <p className="text-sm mt-0.5" style={{ color: "#a8a89d" }}>{info?.description}</p>
                        {svc.message && (
                          <p className="text-sm text-red-500 mt-1">{svc.message}</p>
                        )}
                      </div>
                      <StatusDot
                        status={svc.status === "ok" ? "active" : svc.status === "error" ? "error" : "unknown"}
                        size="lg"
                        pulse={svc.status === "ok"}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {health?.checkedAt && (
              <p className="text-sm mt-5 text-right" style={{ color: "#7a7a70" }}>
                Last checked {new Date(health.checkedAt).toLocaleTimeString()}
              </p>
            )}
          </div>

          <p className="text-center text-sm font-medium mt-8" style={{ color: "#7a7a70" }}>
            Scramble Marketing Hub · v1.0.0
          </p>
        </div>
      </section>
    </>
  );
}
