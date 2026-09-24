"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { authFetch } from "@/lib/api-client";
import { isAdminEmail } from "@/lib/admin";
import { SCRAMBLE_THEME } from "@/lib/scramble-theme";
import { SERVICE_META, ServiceKey } from "@/lib/tiers";

interface Client {
  id: string;
  email: string;
  company_name: string;
  tier: "seo" | "ads" | "full";
  services: ServiceKey[];
  onboarding_complete: boolean;
  google_connected: boolean;
  created_at: string;
  is_active: boolean;
}

interface Stats {
  total: number;
  connected: number;
  onboarding: number;
  seo: number;
  ads: number;
  full: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    (async () => {
      // Gate: only the Scramble team email can view this dashboard.
      const { data } = await authClient.auth.getUser();
      const email = data.user?.email;

      if (!isAdminEmail(email)) {
        router.replace("/admin-login");
        return;
      }
      setAdminEmail(email || "");
      setAuthorized(true);

      const res = await authFetch("/api/scramble/clients");
      if (res.ok) {
        const d = await res.json();
        setClients(d.clients || []);
        setStats(d.stats || null);
      }
      setLoading(false);
    })();
  }, [router]);

  const handleSignOut = async () => {
    await authClient.auth.signOut();
    router.push("/admin-login");
  };

  if (!authorized) {
    return (
      <div className="sc-root" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{SCRAMBLE_THEME}</style>
        <p style={{ color: "#5a6b82" }}>Checking access...</p>
      </div>
    );
  }

  return (
    <div className="sc-root">
      <style>{SCRAMBLE_THEME}</style>
      <style>{adminStyles}</style>

      {/* Nav */}
      <nav className="sc-nav">
        <div className="sc-nav-inner">
          <Link href="/admin" className="sc-logo">
            <div className="sc-logo-mark">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L4.5 12.5H11L9 22L18.5 10.5H12L13 2Z" fill="white" />
              </svg>
            </div>
            <span className="sc-logo-text">Scramble</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span className="admin-nav-badge">Admin</span>
            <Link href="/landing" className="sc-link" style={{ fontSize: 15 }}>View site</Link>
            <button onClick={handleSignOut} className="admin-signout">Sign out</button>
          </div>
        </div>
      </nav>

      <div className="admin-wrap">
        {/* Header */}
        <div className="admin-header">
          <div>
            <div className="sc-eyebrow-admin">Operations Hub</div>
            <h1 className="admin-title">Client Management</h1>
            <p className="admin-subtitle">
              Clients onboard themselves via the signup flow. Monitor connections and services here.
            </p>
          </div>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="admin-stats">
            <div className="admin-stat">
              <div className="admin-stat-value">{stats.total}</div>
              <div className="admin-stat-label">Total Clients</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat-value" style={{ color: "#34c77b" }}>{stats.connected}</div>
              <div className="admin-stat-label">Google Connected</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat-value" style={{ color: "#e89b1f" }}>{stats.onboarding}</div>
              <div className="admin-stat-label">Onboarding</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat-value">{stats.full}</div>
              <div className="admin-stat-label">Full Package</div>
            </div>
          </div>
        )}

        {/* Client list */}
        <div className="admin-section-head">
          <h2>Onboarded Clients</h2>
          <span className="admin-count">{clients.length}</span>
        </div>

        {loading ? (
          <div className="admin-empty">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">👥</div>
            <h3>No clients yet</h3>
            <p>When clients sign up and onboard, they'll appear here automatically.</p>
          </div>
        ) : (
          <div className="admin-clients">
            {clients.map((client) => (
              <div className="admin-client-card" key={client.id}>
                <div className="admin-client-main">
                  <div className="admin-client-avatar">
                    {client.company_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="admin-client-info">
                    <div className="admin-client-name">{client.company_name}</div>
                    <div className="admin-client-email">{client.email}</div>
                  </div>
                </div>

                <div className="admin-client-services">
                  {(client.services || []).map((s) => (
                    <span className="admin-service-pill" key={s} title={SERVICE_META[s]?.label}>
                      {SERVICE_META[s]?.icon}
                    </span>
                  ))}
                </div>

                <div className={`admin-tier-badge tier-${client.tier}`}>
                  {client.tier === "full" ? "Full Package" : client.tier.toUpperCase()}
                </div>

                <div className="admin-client-status">
                  {client.google_connected ? (
                    <span className="admin-status connected">
                      <span className="admin-status-dot" /> Connected
                    </span>
                  ) : (
                    <span className="admin-status pending">
                      <span className="admin-status-dot" /> Not connected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const adminStyles = `
  .admin-nav-badge {
    font-size: 12px; font-weight: 700; color: #2d7fe0;
    background: rgba(74, 158, 255, 0.12); padding: 5px 12px; border-radius: 999px;
  }
  .admin-signout {
    background: rgba(74, 158, 255, 0.1); color: #2d7fe0; border: none;
    padding: 8px 16px; border-radius: 10px; font-size: 14px; font-weight: 600;
    cursor: pointer; font-family: inherit; transition: all 0.2s;
  }
  .admin-signout:hover { background: rgba(74, 158, 255, 0.18); }
  .admin-wrap { max-width: 1080px; margin: 0 auto; padding: 120px 28px 80px; }
  .admin-header { margin-bottom: 36px; }
  .sc-eyebrow-admin {
    display: inline-block; font-size: 13px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; color: #4a9eff; margin-bottom: 10px;
  }
  .admin-title { font-size: 36px; font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; }
  .admin-subtitle { font-size: 16px; color: #5a6b82; max-width: 560px; }

  .admin-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-bottom: 44px; }
  .admin-stat {
    background: rgba(255,255,255,0.92); backdrop-filter: blur(16px);
    border: 1px solid rgba(122, 178, 255, 0.16); border-radius: 18px; padding: 24px;
    box-shadow: 0 10px 26px rgba(45, 127, 224, 0.06), inset 0 1px 0 rgba(255,255,255,0.9);
  }
  .admin-stat-value { font-size: 36px; font-weight: 800; letter-spacing: -1.5px; color: #16243a; }
  .admin-stat-label { font-size: 14px; color: #8a97ab; font-weight: 500; margin-top: 4px; }

  .admin-section-head { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .admin-section-head h2 { font-size: 20px; font-weight: 700; color: #16243a; }
  .admin-count {
    font-size: 13px; font-weight: 700; color: #2d7fe0;
    background: rgba(74, 158, 255, 0.12); padding: 3px 11px; border-radius: 999px;
  }

  .admin-empty {
    text-align: center; padding: 70px 28px; color: #8a97ab;
    background: rgba(255,255,255,0.7); border: 1px dashed rgba(122, 178, 255, 0.3);
    border-radius: 20px;
  }
  .admin-empty-icon { font-size: 44px; margin-bottom: 16px; }
  .admin-empty h3 { font-size: 20px; font-weight: 700; color: #16243a; margin-bottom: 8px; }
  .admin-empty p { font-size: 15px; }

  .admin-clients { display: flex; flex-direction: column; gap: 14px; }
  .admin-client-card {
    display: flex; align-items: center; gap: 20px;
    background: rgba(255,255,255,0.92); backdrop-filter: blur(16px);
    border: 1px solid rgba(122, 178, 255, 0.16); border-radius: 18px; padding: 20px 24px;
    box-shadow: 0 8px 22px rgba(45, 127, 224, 0.05), inset 0 1px 0 rgba(255,255,255,0.9);
    transition: all 0.3s;
  }
  .admin-client-card:hover { transform: translateY(-2px); box-shadow: 0 14px 34px rgba(45, 127, 224, 0.12); }

  .admin-client-main { display: flex; align-items: center; gap: 16px; flex: 1; min-width: 0; }
  .admin-client-avatar {
    width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; font-weight: 800; color: white;
    background: linear-gradient(135deg, #4a9eff 0%, #2d7fe0 100%);
    box-shadow: 0 6px 16px rgba(74, 158, 255, 0.3);
  }
  .admin-client-name { font-size: 16px; font-weight: 700; color: #16243a; }
  .admin-client-email { font-size: 14px; color: #8a97ab; }

  .admin-client-services { display: flex; gap: 6px; }
  .admin-service-pill {
    width: 34px; height: 34px; border-radius: 10px; font-size: 16px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(74, 158, 255, 0.08); border: 1px solid rgba(122, 178, 255, 0.14);
  }

  .admin-tier-badge {
    font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 999px; white-space: nowrap;
  }
  .tier-seo { background: rgba(74, 158, 255, 0.12); color: #2d7fe0; }
  .tier-ads { background: rgba(244, 185, 66, 0.15); color: #c77f0a; }
  .tier-full { background: linear-gradient(135deg, rgba(74,158,255,0.15), rgba(244,185,66,0.15)); color: #2d7fe0; }

  .admin-client-status { min-width: 130px; text-align: right; }
  .admin-status { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; }
  .admin-status.connected { color: #1a8a4f; }
  .admin-status.pending { color: #c0392b; }
  .admin-status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }

  @media (max-width: 760px) {
    .admin-stats { grid-template-columns: repeat(2, 1fr); }
    .admin-client-card { flex-wrap: wrap; gap: 14px; }
    .admin-client-status { min-width: auto; text-align: left; }
    .admin-title { font-size: 28px; }
  }
`;
