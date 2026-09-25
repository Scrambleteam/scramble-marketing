"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { authFetch } from "@/lib/api-client";
import { SCRAMBLE_THEME } from "@/lib/scramble-theme";
import { SERVICE_META, servicesForTier, TierKey, ServiceKey } from "@/lib/tiers";

export default function DashboardSettings() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [tier, setTier] = useState<TierKey>("full");
  const [services, setServices] = useState<ServiceKey[]>([]);
  const [connected, setConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState("");
  const [metaConnected, setMetaConnected] = useState(false);
  const [metaConnectedName, setMetaConnectedName] = useState("");
  const [metaBusy, setMetaBusy] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [billingBusy, setBillingBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await authClient.auth.getUser();
      const userEmail = data.user?.email;
      if (!userEmail) {
        router.push("/auth/signin");
        return;
      }
      setEmail(userEmail);

      const res = await authFetch(`/api/scramble/me?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const p = await res.json();
        setCompany(p.company_name);
        setTier(p.tier);
        setServices(p.services || servicesForTier(p.tier));
        setSubscriptionStatus(p.subscription_status || null);
      }

      const statusRes = await authFetch(`/api/auth/google/status?clientId=${encodeURIComponent(userEmail)}`);
      if (statusRes.ok) {
        const status = await statusRes.json();
        setConnected(status.connected);
        setConnectedEmail(status.email || "");
      }

      const metaStatusRes = await authFetch(`/api/auth/meta/status?clientId=${encodeURIComponent(userEmail)}`);
      if (metaStatusRes.ok) {
        const metaStatus = await metaStatusRes.json();
        setMetaConnected(metaStatus.connected);
        setMetaConnectedName(metaStatus.name || "");
      }
      setLoading(false);
    })();
  }, [router]);

  const handleConnect = async () => {
    setBusy(true);
    const res = await authFetch("/api/auth/google/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: email }),
    });
    const data = await res.json();
    if (data.authUrl) window.location.href = data.authUrl;
    else setBusy(false);
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect your Google account?")) return;
    setBusy(true);
    await authFetch("/api/auth/google/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: email }),
    });
    setConnected(false);
    setConnectedEmail("");
    setBusy(false);
  };

  const handleConnectMeta = async () => {
    setMetaBusy(true);
    const res = await authFetch("/api/auth/meta/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: email }),
    });
    const data = await res.json();
    if (data.authUrl) window.location.href = data.authUrl;
    else setMetaBusy(false);
  };

  const handleDisconnectMeta = async () => {
    if (!confirm("Disconnect your Meta account?")) return;
    setMetaBusy(true);
    await authFetch("/api/auth/meta/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: email }),
    });
    setMetaConnected(false);
    setMetaConnectedName("");
    setMetaBusy(false);
  };

  const handleManageBilling = async () => {
    setBillingBusy(true);
    try {
      const res = await authFetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Couldn't open billing portal. Please try again.");
        setBillingBusy(false);
      }
    } catch (err) {
      console.error(err);
      alert("Couldn't open billing portal. Please try again.");
      setBillingBusy(false);
    }
  };

  const displayServices = services.length ? services : servicesForTier(tier);

  return (
    <div className="sc-root">
      <style>{SCRAMBLE_THEME}</style>
      <style>{setStyles}</style>

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
          <Link href="/dashboard" className="sc-link" style={{ fontSize: 15 }}>← Dashboard</Link>
        </div>
      </nav>

      <div className="set-wrap">
        <h1 className="set-title">Settings</h1>
        <p className="set-sub">Manage your account and integrations.</p>

        {loading ? (
          <p style={{ color: "#5a6b82" }}>Loading...</p>
        ) : (
          <>
            {/* Account */}
            <div className="sc-card set-card">
              <h2 className="set-card-title">Account</h2>
              <div className="set-row"><span>Company</span><strong>{company}</strong></div>
              <div className="set-row"><span>Email</span><strong>{email}</strong></div>
              <div className="set-row"><span>Plan</span><strong style={{ textTransform: "capitalize" }}>{tier}</strong></div>
            </div>

            {/* Billing */}
            <div className="sc-card set-card">
              <h2 className="set-card-title">Billing</h2>
              <div className="set-row">
                <span>Status</span>
                <strong style={{ textTransform: "capitalize" }}>
                  {subscriptionStatus || "No active subscription"}
                </strong>
              </div>
              <p style={{ color: "#5a6b82", margin: "14px 0 18px", fontSize: 15 }}>
                Update your card, view invoices, or cancel your subscription.
              </p>
              <button onClick={handleManageBilling} disabled={billingBusy} className="sc-btn-primary" style={{ width: "100%" }}>
                {billingBusy ? "Opening billing portal..." : "Manage billing →"}
              </button>
            </div>

            {/* Google connection */}
            <div className="sc-card set-card">
              <h2 className="set-card-title">Google Account</h2>
              {connected ? (
                <>
                  <div className="sc-success" style={{ marginBottom: 18 }}>
                    ✓ Connected as {connectedEmail}
                  </div>
                  <button onClick={handleDisconnect} disabled={busy} className="set-disconnect">
                    {busy ? "..." : "Disconnect Google Account"}
                  </button>
                </>
              ) : (
                <>
                  <p style={{ color: "#5a6b82", marginBottom: 18, fontSize: 15 }}>
                    Connect your Google account to pull live data into your dashboards.
                  </p>
                  <button onClick={handleConnect} disabled={busy} className="sc-btn-google">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {busy ? "Opening Google..." : "Connect Google Account"}
                  </button>
                </>
              )}
            </div>

            {/* Meta connection */}
            <div className="sc-card set-card">
              <h2 className="set-card-title">Meta Account</h2>
              {metaConnected ? (
                <>
                  <div className="sc-success" style={{ marginBottom: 18 }}>
                    ✓ Connected as {metaConnectedName}
                  </div>
                  <button onClick={handleDisconnectMeta} disabled={metaBusy} className="set-disconnect">
                    {metaBusy ? "..." : "Disconnect Meta Account"}
                  </button>
                </>
              ) : (
                <>
                  <p style={{ color: "#5a6b82", marginBottom: 18, fontSize: 15 }}>
                    Connect your Meta account so we can run and report on your Facebook &amp; Instagram ad campaigns.
                  </p>
                  <button onClick={handleConnectMeta} disabled={metaBusy} className="sc-btn-meta">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z" fill="white" />
                    </svg>
                    {metaBusy ? "Opening Meta..." : "Connect Meta Account"}
                  </button>
                </>
              )}
            </div>

            {/* Active services */}
            <div className="sc-card set-card">
              <h2 className="set-card-title">Your Services</h2>
              <div className="set-services">
                {displayServices.map((s) => (
                  <div className="set-service" key={s}>
                    <span>{SERVICE_META[s].icon}</span>
                    <div>
                      <div className="set-service-name">{SERVICE_META[s].label}</div>
                      <div className="set-service-desc">{SERVICE_META[s].desc}</div>
                    </div>
                    <span className="set-service-active">Active</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const setStyles = `
  .set-wrap { max-width: 640px; margin: 0 auto; padding: 130px 28px 80px; }
  .set-title { font-size: 32px; font-weight: 800; letter-spacing: -1px; margin-bottom: 6px; }
  .set-sub { font-size: 16px; color: #5a6b82; margin-bottom: 32px; }
  .set-card { padding: 28px; margin-bottom: 20px; }
  .set-card-title { font-size: 18px; font-weight: 700; color: #16243a; margin-bottom: 20px; }
  .set-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(122,178,255,0.1); font-size: 15px; }
  .set-row:last-child { border-bottom: none; }
  .set-row span { color: #8a97ab; }
  .set-row strong { color: #16243a; }
  .set-disconnect {
    background: rgba(255, 138, 128, 0.12); color: #c0392b; border: 1px solid rgba(255,138,128,0.3);
    padding: 12px 20px; border-radius: 12px; font-size: 15px; font-weight: 600;
    cursor: pointer; width: 100%; font-family: inherit; transition: all 0.2s;
  }
  .set-disconnect:hover { background: rgba(255, 138, 128, 0.2); }
  .set-services { display: flex; flex-direction: column; gap: 12px; }
  .set-service {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 16px; border-radius: 14px;
    background: rgba(74, 158, 255, 0.04); border: 1px solid rgba(122, 178, 255, 0.12);
  }
  .set-service > span:first-child { font-size: 22px; }
  .set-service > div { flex: 1; }
  .set-service-name { font-size: 15px; font-weight: 700; color: #16243a; }
  .set-service-desc { font-size: 13px; color: #8a97ab; }
  .set-service-active {
    font-size: 12px; font-weight: 700; color: #1a8a4f;
    background: rgba(52, 199, 123, 0.12); padding: 4px 10px; border-radius: 999px;
  }
`;
