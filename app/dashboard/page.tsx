"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { authFetch } from "@/lib/api-client";
import { SCRAMBLE_THEME } from "@/lib/scramble-theme";
import { SERVICE_META, servicesForTier, TierKey, ServiceKey } from "@/lib/tiers";

interface Profile {
  email: string;
  company_name: string;
  tier: TierKey;
  services: ServiceKey[];
  google_connected: boolean;
}

export default function ClientDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [metaConnected, setMetaConnected] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [metaBusy, setMetaBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await authClient.auth.getUser();
      const email = data.user?.email;

      if (!email) {
        router.push("/auth/signin");
        return;
      }

      const res = await authFetch(`/api/scramble/me?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const p = await res.json();
        setProfile(p);

        const statusRes = await authFetch(`/api/auth/google/status?clientId=${encodeURIComponent(email)}`);
        if (statusRes.ok) {
          const status = await statusRes.json();
          setGoogleConnected(status.connected);
        }

        const metaStatusRes = await authFetch(`/api/auth/meta/status?clientId=${encodeURIComponent(email)}`);
        if (metaStatusRes.ok) {
          const metaStatus = await metaStatusRes.json();
          setMetaConnected(metaStatus.connected);
        }
      }
      setLoading(false);
    })();
  }, [router]);

  const handleSignOut = async () => {
    await authClient.auth.signOut();
    router.push("/landing");
  };

  const handleDisconnectGoogle = async () => {
    if (!profile) return;
    if (!confirm("Disconnect your Google account? Your dashboards will stop showing live data until you reconnect.")) return;
    setGoogleBusy(true);
    await authFetch("/api/auth/google/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: profile.email }),
    });
    setGoogleConnected(false);
    setGoogleBusy(false);
  };

  const handleDisconnectMeta = async () => {
    if (!profile) return;
    if (!confirm("Disconnect your Meta account? We'll stop reporting on your Facebook & Instagram ads until you reconnect.")) return;
    setMetaBusy(true);
    await authFetch("/api/auth/meta/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: profile.email }),
    });
    setMetaConnected(false);
    setMetaBusy(false);
  };

  if (loading) {
    return (
      <div className="sc-root" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{SCRAMBLE_THEME}</style>
        <p style={{ color: "#5a6b82" }}>Loading your dashboard...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="sc-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <style>{SCRAMBLE_THEME}</style>
        <p style={{ color: "#5a6b82" }}>No profile found.</p>
        <Link href="/pricing" className="sc-link">Choose a plan →</Link>
      </div>
    );
  }

  const services = profile.services?.length ? profile.services : servicesForTier(profile.tier);

  return (
    <div className="sc-root">
      <style>{SCRAMBLE_THEME}</style>
      <style>{dashStyles}</style>

      {/* Top bar */}
      <nav className="sc-nav">
        <div className="sc-nav-inner">
          <Link href="/dashboard" className="sc-logo">
            <div className="sc-logo-mark">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L4.5 12.5H11L9 22L18.5 10.5H12L13 2Z" fill="white" />
              </svg>
            </div>
            <span className="sc-logo-text">Scramble</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span className="dash-company">{profile.company_name}</span>
            <button onClick={handleSignOut} className="dash-signout">Sign out</button>
          </div>
        </div>
      </nav>

      <div className="dash-wrap">
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Welcome back, {profile.company_name}</h1>
            <p className="dash-subtitle">Here's your marketing overview.</p>
          </div>
          <div className="dash-conn-group">
            <div className={`dash-conn ${googleConnected ? "on" : "off"}`}>
              <span className="dash-conn-dot" />
              {googleConnected ? "Google Connected" : "Google Not Connected"}
              {googleConnected && (
                <button
                  onClick={handleDisconnectGoogle}
                  disabled={googleBusy}
                  className="dash-conn-disconnect"
                  title="Disconnect Google"
                >
                  {googleBusy ? "…" : "Disconnect"}
                </button>
              )}
            </div>
            <div className={`dash-conn ${metaConnected ? "on" : "off"}`}>
              <span className="dash-conn-dot" />
              {metaConnected ? "Meta Connected" : "Meta Not Connected"}
              {metaConnected && (
                <button
                  onClick={handleDisconnectMeta}
                  disabled={metaBusy}
                  className="dash-conn-disconnect"
                  title="Disconnect Meta"
                >
                  {metaBusy ? "…" : "Disconnect"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Google connect prompt if not connected */}
        {!googleConnected && (
          <div className="dash-connect-banner">
            <div>
              <h3>Connect your Google account to see live data</h3>
              <p>Your dashboards are ready — connect Google to start pulling your data.</p>
            </div>
            <Link href="/onboarding" className="dash-connect-btn">Connect Google →</Link>
          </div>
        )}

        {/* Meta connect prompt if not connected */}
        {!metaConnected && (
          <div className="dash-connect-banner dash-connect-meta">
            <div>
              <h3>Connect Meta to track Facebook &amp; Instagram Ads</h3>
              <p>See ad spend, clicks, conversions, and ROAS from your Meta campaigns.</p>
            </div>
            <Link href="/onboarding" className="dash-connect-btn dash-connect-btn-meta">Connect Meta →</Link>
          </div>
        )}

        {/* Service dashboards */}
        <div className="dash-services">
          {services.map((service) => (
            <ServiceDashboardCard
              key={service}
              service={service}
              connected={service === "meta_ads" ? metaConnected : googleConnected}
            />
          ))}
        </div>

        {/* Settings link */}
        <div className="dash-footer-links">
          <Link href="/dashboard/settings" className="sc-link">Manage Google connection & settings →</Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Per-service dashboard card ─── */

function ServiceDashboardCard({ service, connected }: { service: ServiceKey; connected: boolean }) {
  const meta = SERVICE_META[service];

  // Placeholder metrics per service (real data comes from subagents later)
  const METRICS: Record<ServiceKey, { label: string; value: string; trend: string; trendUp: boolean }[]> = {
    search_console: [
      { label: "Impressions", value: connected ? "248,120" : "—", trend: "+12.4%", trendUp: true },
      { label: "Clicks", value: connected ? "8,420" : "—", trend: "+8.1%", trendUp: true },
      { label: "Avg Position", value: connected ? "14.2" : "—", trend: "+2.3", trendUp: true },
    ],
    analytics: [
      { label: "Users", value: connected ? "12,840" : "—", trend: "+6.7%", trendUp: true },
      { label: "Sessions", value: connected ? "19,210" : "—", trend: "+9.2%", trendUp: true },
      { label: "Avg Dwell", value: connected ? "1m 48s" : "—", trend: "+14s", trendUp: true },
    ],
    ads: [
      { label: "Spend", value: connected ? "£3,240" : "—", trend: "-4.1%", trendUp: true },
      { label: "Conversions", value: connected ? "342" : "—", trend: "+23.6%", trendUp: true },
      { label: "ROAS", value: connected ? "4.8x" : "—", trend: "+0.6x", trendUp: true },
    ],
    meta_ads: [
      { label: "Ad Spend", value: connected ? "£1,860" : "—", trend: "+9.4%", trendUp: true },
      { label: "Clicks", value: connected ? "5,210" : "—", trend: "+11.2%", trendUp: true },
      { label: "Conversions", value: connected ? "128" : "—", trend: "+17.3%", trendUp: true },
    ],
  };

  return (
    <div className="service-dash">
      <div className="service-dash-head">
        <div className="service-dash-icon">{meta.icon}</div>
        <div>
          <h2 className="service-dash-title">{meta.label}</h2>
          <p className="service-dash-desc">{meta.desc}</p>
        </div>
      </div>

      <div className="service-dash-stats">
        {METRICS[service].map((m, i) => (
          <div className="service-stat" key={i}>
            <div className="service-stat-label">{m.label}</div>
            <div className="service-stat-value">{m.value}</div>
            {connected && (
              <div className={`service-stat-trend ${m.trendUp ? "up" : "down"}`}>
                {m.trendUp ? "▲" : "▼"} {m.trend}
              </div>
            )}
          </div>
        ))}
      </div>

      {!connected && service !== 'meta_ads' && (
        <div className="service-dash-locked">
          🔒 Connect Google to unlock live {meta.label} data
        </div>
      )}
      {service === 'meta_ads' && !connected && (
        <div className="service-dash-locked">
          🔒 Connect Meta to unlock live Facebook &amp; Instagram Ads data
        </div>
      )}
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

  .service-dash-locked {
    margin-top: 20px; padding: 14px; border-radius: 12px; text-align: center;
    background: rgba(122, 178, 255, 0.08); color: #5a6b82; font-size: 14px; font-weight: 500;
  }

  .dash-footer-links { text-align: center; margin-top: 40px; }

  @media (max-width: 700px) {
    .service-dash-stats { grid-template-columns: 1fr; }
    .dash-title { font-size: 26px; }
  }
`;
