"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { authFetch } from "@/lib/api-client";
import { SCRAMBLE_THEME } from "@/lib/scramble-theme";
import { servicesForTier, TierKey, ServiceKey } from "@/lib/tiers";
import ServiceMetricsCard, { ServiceData, SERVICE_CARD_STYLES } from "@/components/dashboard/ServiceMetricsCard";

interface Profile {
  email: string;
  company_name: string;
  tier: TierKey;
  services: ServiceKey[];
}

type Metrics = Partial<Record<"search_console" | "analytics" | "ads", ServiceData>>;

export default function ClientDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metaConnected, setMetaConnected] = useState(false);
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

        // Google data is read by the Scramble team's agency connection;
        // the client never connects Google themselves.
        authFetch("/api/dashboard/metrics")
          .then((r) => (r.ok ? r.json() : {}))
          .then(setMetrics)
          .catch(() => setMetrics({}));

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
      <style>{SERVICE_CARD_STYLES}</style>

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
            <p className="dash-subtitle">Your marketing over the last 28 days, compared with the 28 days before.</p>
          </div>
          <div className="dash-conn-group">
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
            <ServiceMetricsCard
              key={service}
              service={service}
              data={service === "meta_ads" ? undefined : metrics?.[service] ?? (metrics ? null : undefined)}
              metaConnected={metaConnected}
            />
          ))}
        </div>

        {/* Settings link */}
        <div className="dash-footer-links">
          <Link href="/dashboard/settings" className="sc-link">Account, billing & data access →</Link>
        </div>
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
