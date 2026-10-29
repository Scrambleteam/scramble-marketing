"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { authFetch } from "@/lib/api-client";
import { AGENCY_GOOGLE_EMAIL } from "@/lib/admin";
import { SCRAMBLE_THEME } from "@/lib/scramble-theme";
import { SERVICE_META, servicesForTier, TierKey, ServiceKey } from "@/lib/tiers";

export default function DashboardSettings() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [tier, setTier] = useState<TierKey>("full");
  const [services, setServices] = useState<ServiceKey[]>([]);
  const [metaConnected, setMetaConnected] = useState(false);
  const [metaConnectedName, setMetaConnectedName] = useState("");
  const [metaBusy, setMetaBusy] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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

      const metaStatusRes = await authFetch(`/api/auth/meta/status?clientId=${encodeURIComponent(userEmail)}`);
      if (metaStatusRes.ok) {
        const metaStatus = await metaStatusRes.json();
        setMetaConnected(metaStatus.connected);
        setMetaConnectedName(metaStatus.name || "");
      }
      setLoading(false);
    })();
  }, [router]);

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

            {/* Google access */}
            <div className="sc-card set-card">
              <h2 className="set-card-title">Google data access</h2>
              <p style={{ color: "#5a6b82", marginBottom: 12, fontSize: 15, lineHeight: 1.6 }}>
                Your Scramble team reads your Search Console, Analytics and Google Ads data through
                our agency account, <strong>{AGENCY_GOOGLE_EMAIL}</strong>, which you added as a user.
              </p>
              <p style={{ color: "#5a6b82", fontSize: 14, lineHeight: 1.6 }}>
                To stop sharing, remove that address from the user settings in each Google product.
                Your dashboard will stop showing that data.
              </p>
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
