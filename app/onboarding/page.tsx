"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { authFetch, authFetchOrThrow } from "@/lib/api-client";
import { SCRAMBLE_THEME } from "@/lib/scramble-theme";
import { SERVICE_META, servicesForTier, TierKey, ServiceKey } from "@/lib/tiers";

function OnboardingInner() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [company, setCompany] = useState<string>("");
  const [siteUrl, setSiteUrl] = useState<string>("");
  const [tier, setTier] = useState<TierKey>("full");
  const [services, setServices] = useState<ServiceKey[]>([]);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [metaConnected, setMetaConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connectingMeta, setConnectingMeta] = useState(false);
  const [oauthError, setOauthError] = useState("");
  const [finishError, setFinishError] = useState("");
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    (async () => {
      // Check OAuth result in URL
      const params = new URLSearchParams(window.location.search);
      if (params.get("oauth_success")) {
        setGoogleConnected(true);
      }
      if (params.get("oauth_error")) {
        setOauthError("Google connection failed. Please try again.");
      }

      // Get logged-in user
      const { data } = await authClient.auth.getUser();
      const userEmail = data.user?.email || params.get("email") || "";
      setEmail(userEmail);

      if (userEmail) {
        // Fetch their profile
        const res = await authFetch(`/api/scramble/me?email=${encodeURIComponent(userEmail)}`);
        if (res.ok) {
          const profile = await res.json();
          setCompany(profile.company_name || "");
          setSiteUrl(profile.site_url || "");
          setTier(profile.tier || "full");
          setServices(profile.services || servicesForTier(profile.tier || "full"));
          setGoogleConnected(profile.google_connected || false);
        }

        // Check live OAuth status
        const statusRes = await authFetch(`/api/auth/google/status?clientId=${encodeURIComponent(userEmail)}`);
        if (statusRes.ok) {
          const status = await statusRes.json();
          if (status.connected) setGoogleConnected(true);
        }
      }
      setLoading(false);
    })();
  }, []);

  const handleConnectGoogle = async () => {
    setConnecting(true);
    setOauthError("");

    // Resolve email: prefer state, else the live session, else the URL param.
    let clientEmail = email;
    if (!clientEmail) {
      const { data } = await authClient.auth.getUser();
      clientEmail = data.user?.email || new URLSearchParams(window.location.search).get("email") || "";
      if (clientEmail) setEmail(clientEmail);
    }

    if (!clientEmail) {
      setOauthError("We couldn't find your session. Please sign in again.");
      setConnecting(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/google/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: clientEmail }),
      });
      const data = await res.json();
      if (res.ok && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setOauthError(data.error || "Could not start Google connection.");
        setConnecting(false);
      }
    } catch (err) {
      console.error("[connect google]", err);
      setOauthError("Could not start Google connection. Please try again.");
      setConnecting(false);
    }
  };

  const handleFinish = async () => {
    // Mark onboarding complete and save site URL. This must succeed before
    // we leave the page — silently failing here (e.g. the 401 this used to
    // get from a bare fetch()) is exactly what made finished signups look
    // like they never happened.
    setFinishError("");
    setFinishing(true);
    try {
      await authFetchOrThrow("/api/scramble/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          onboarding_complete: true,
          google_connected: true,
          site_url: siteUrl || null,
        }),
      });
      router.push("/dashboard");
    } catch (err) {
      console.error("[finish onboarding]", err);
      setFinishError(
        "Couldn't save your progress — please check your connection and try again."
      );
      setFinishing(false);
    }
  };

  const displayServices = services.length ? services : servicesForTier(tier);

  return (
    <div className="sc-root">
      <style>{SCRAMBLE_THEME}</style>
      <style>{onboardingStyles}</style>

      <nav className="sc-nav">
        <div className="sc-nav-inner">
          <Link href="/landing" className="sc-logo">
            <div className="sc-logo-mark">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L4.5 12.5H11L9 22L18.5 10.5H12L13 2Z" fill="white" />
              </svg>
            </div>
            <span className="sc-logo-text">Scramble</span>
          </Link>
        </div>
      </nav>

      <div className="onboard-wrap">
        {/* Progress */}
        <div className="onboard-steps">
          <div className="onboard-step done">
            <div className="onboard-step-circle">✓</div>
            <span>Account</span>
          </div>
          <div className="onboard-step-bar" />
          <div className={`onboard-step ${googleConnected ? "done" : "active"}`}>
            <div className="onboard-step-circle">{googleConnected ? "✓" : "2"}</div>
            <span>Google</span>
          </div>
          <div className="onboard-step-bar" />
          <div className={`onboard-step ${googleConnected ? (metaConnected ? "done" : "active") : ""}`}>
            <div className="onboard-step-circle">{metaConnected ? "✓" : "3"}</div>
            <span>Meta</span>
          </div>
          <div className="onboard-step-bar" />
          <div className={`onboard-step ${googleConnected && metaConnected ? "active" : ""}`}>
            <div className="onboard-step-circle">4</div>
            <span>Done</span>
          </div>
        </div>

        <div className="sc-card onboard-card">
          {loading ? (
            <p style={{ textAlign: "center", color: "#5a6b82" }}>Loading...</p>
          ) : (
            <>
              <h1 className="onboard-title">
                Welcome{company ? `, ${company}` : ""} 👋
              </h1>
              <p className="onboard-sub">
                Connect your accounts to unlock your dashboards. We&apos;ll pull your
                data automatically — you won&apos;t need to do anything manually.
              </p>

              {/* Website URL */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#3d5a6e", marginBottom: 6 }}>
                  Your Website URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  className="sc-input"
                  style={{ width: "100%" }}
                />
                <p style={{ fontSize: "0.75rem", color: "#5a6b82", marginTop: 4 }}>
                  We&apos;ll use this to find your Search Console property automatically.
                </p>
              </div>

              {oauthError && <div className="sc-error" style={{ marginBottom: 20 }}>{oauthError}</div>}

              {/* ── Connection Cards ── */}
              <div className="onboard-services-label" style={{ marginBottom: 14 }}>Connect your accounts</div>

              {/* Google Connection */}
              <div className="connect-card" style={{ marginBottom: 14 }}>
                <div className="connect-card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="connect-icon connect-icon-google">
                      <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    </div>
                    <div>
                      <div className="connect-card-title">Google</div>
                      <div className="connect-card-desc">Search Console, Analytics &amp; Ads</div>
                    </div>
                  </div>
                  {googleConnected && <span className="connect-status-done">✓ Connected</span>}
                </div>
                {!googleConnected && (
                  <button onClick={handleConnectGoogle} className="sc-btn-google" disabled={connecting} style={{ marginTop: 14 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {connecting ? "Opening Google..." : "Connect Google Account"}
                  </button>
                )}
              </div>

              {/* Meta Connection */}
              <div className="connect-card" style={{ marginBottom: 24 }}>
                <div className="connect-card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="connect-icon connect-icon-meta">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z" fill="white" />
                      </svg>
                    </div>
                    <div>
                      <div className="connect-card-title">Meta</div>
                      <div className="connect-card-desc">Facebook &amp; Instagram Ads</div>
                    </div>
                  </div>
                  {metaConnected && <span className="connect-status-done">✓ Connected</span>}
                </div>
                {!metaConnected && (
                  <button
                    onClick={() => {
                      setConnectingMeta(true);
                      fetch("/api/auth/meta/initiate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ clientId: email }),
                      })
                        .then((r) => r.json())
                        .then((d) => {
                          if (d.authUrl) window.location.href = d.authUrl;
                          else {
                            setOauthError(d.error || "Could not start Meta connection.");
                            setConnectingMeta(false);
                          }
                        })
                        .catch(() => {
                          setOauthError("Could not start Meta connection.");
                          setConnectingMeta(false);
                        });
                    }}
                    className="sc-btn-meta"
                    disabled={connectingMeta}
                    style={{ marginTop: 14 }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z" fill="white" />
                    </svg>
                    {connectingMeta ? "Opening Meta..." : "Connect Meta Ads Account"}
                  </button>
                )}
              </div>

              {finishError && <div className="sc-error" style={{ marginBottom: 16 }}>{finishError}</div>}

              {/* Done / Go to dashboard */}
              {googleConnected && metaConnected ? (
                <button onClick={handleFinish} className="sc-btn-primary" disabled={finishing}>
                  {finishing ? "Saving..." : "Go to my dashboard →"}
                </button>
              ) : (googleConnected || metaConnected) && !(googleConnected && metaConnected) ? (
                <button
                  onClick={handleFinish}
                  disabled={finishing}
                  style={{ display: "block", width: "100%", textAlign: "center", background: "none", border: "none", color: "#8a97ab", fontSize: 13, cursor: "pointer", textDecoration: "underline", marginBottom: 8 }}
                >
                  {finishing ? "Saving..." : "Skip remaining & go to dashboard"}
                </button>
              ) : null}

              <p className="onboard-secure">
                🔒 Your data is secure. We only request read access to the services in your plan.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingInner />
    </Suspense>
  );
}

const onboardingStyles = `
  .onboard-wrap { max-width: 620px; margin: 0 auto; padding: 140px 28px 80px; }
  .onboard-steps { display: flex; align-items: center; justify-content: center; margin-bottom: 40px; }
  .onboard-step { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .onboard-step-circle {
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 700;
    background: rgba(122, 178, 255, 0.15); color: #8a97ab;
    transition: all 0.3s;
  }
  .onboard-step.active .onboard-step-circle {
    background: linear-gradient(135deg, #4a9eff, #2d7fe0); color: white;
    box-shadow: 0 6px 16px rgba(74, 158, 255, 0.35);
  }
  .onboard-step.done .onboard-step-circle {
    background: linear-gradient(135deg, #34c77b, #1a8a4f); color: white;
    box-shadow: 0 6px 16px rgba(52, 199, 123, 0.35);
  }
  .onboard-step span { font-size: 13px; font-weight: 600; color: #5a6b82; }
  .onboard-step-bar { width: 60px; height: 2px; background: rgba(122, 178, 255, 0.25); margin: 0 8px 24px; }

  .onboard-card { padding: 44px 40px; }
  .onboard-title { font-size: 30px; font-weight: 800; letter-spacing: -1px; margin-bottom: 12px; }
  .onboard-sub { font-size: 16px; color: #5a6b82; line-height: 1.6; margin-bottom: 32px; }

  .onboard-services { margin-bottom: 32px; }
  .onboard-services-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #8a97ab; font-weight: 700; margin-bottom: 14px; }
  .onboard-service-list { display: flex; flex-direction: column; gap: 12px; }
  .onboard-service-chip {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 16px; border-radius: 14px;
    background: rgba(74, 158, 255, 0.05);
    border: 1px solid rgba(122, 178, 255, 0.15);
  }
  .onboard-service-icon { font-size: 24px; }
  .onboard-service-name { font-size: 15px; font-weight: 700; color: #16243a; }
  .onboard-service-desc { font-size: 13px; color: #8a97ab; }

  .connect-card {
    padding: 20px; border-radius: 16px;
    background: rgba(74, 158, 255, 0.04);
    border: 1px solid rgba(122, 178, 255, 0.15);
  }
  .connect-card-header {
    display: flex; align-items: center; justify-content: space-between;
  }
  .connect-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
  }
  .connect-icon-google { background: #f1f3f4; }
  .connect-icon-meta { background: #1877F2; }
  .connect-card-title { font-size: 15px; font-weight: 700; color: #16243a; }
  .connect-card-desc { font-size: 13px; color: #8a97ab; }
  .connect-status-done {
    font-size: 13px; font-weight: 600; color: #34c77b;
    background: rgba(52, 199, 123, 0.1); padding: 4px 12px; border-radius: 100px;
  }

  .sc-btn-meta {
    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    width: 100%; padding: 14px 24px; border-radius: 12px;
    font-size: 16px; font-weight: 600; cursor: pointer;
    background: #1877F2; color: white; border: none;
    box-shadow: 0 4px 14px rgba(24, 119, 242, 0.3);
    transition: all 0.2s;
  }
  .sc-btn-meta:hover { background: #1565C0; }
  .sc-btn-meta:disabled { opacity: 0.6; cursor: not-allowed; }
  .onboard-secure { text-align: center; margin-top: 20px; font-size: 13px; color: #8a97ab; }

  @media (max-width: 500px) {
    .onboard-card { padding: 32px 24px; }
    .onboard-step-bar { width: 32px; }
    .onboard-step span { font-size: 11px; }
  }
`;
