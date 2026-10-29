"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api-client";

export interface AgencyStatus {
  agencyEmail: string;
  connected: boolean;
  email: string | null;
  connectedBy: string | null;
  updatedAt: string | null;
  ads: { developerToken: boolean; managerAccount: boolean };
}

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Google sign-in was cancelled.",
  invalid_state: "The connection request expired or didn't start from this page. Please try again.",
  wrong_account: "That isn't the agency Google account. Sign in with the account clients have added.",
  no_refresh_token: "Google didn't return a long-lived token. Please try again.",
  token_exchange_failed: "Google rejected the sign-in. Check the OAuth client settings in Google Cloud.",
};

function readOAuthResult(): { kind: "success" | "error"; text: string } | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  if (params.get("google") === "connected") {
    return { kind: "success", text: "Agency Google account connected." };
  }
  const code = params.get("google_error");
  if (!code) return null;
  const account = params.get("account");
  return {
    kind: "error",
    text: (ERROR_MESSAGES[code] || `Google connection failed (${code}).`) + (account ? ` You signed in as ${account}.` : ""),
  };
}

/**
 * Connect / reconnect / disconnect the single agency Google account.
 * Shows any result passed back from the OAuth callback in the URL.
 */
export default function AgencyGooglePanel({
  status,
  onChange,
}: {
  status: AgencyStatus | null;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  // Rendered only client-side (after the admin check), so reading the
  // OAuth result from the URL during the first render is safe.
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(readOAuthResult);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("google") || params.has("google_error")) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const connect = async () => {
    setBusy(true);
    setMessage(null);
    const res = await authFetch("/api/auth/google/initiate", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.authUrl) {
      window.location.href = data.authUrl;
    } else {
      setMessage({ kind: "error", text: data.error || "Could not start the Google connection." });
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!confirm("Disconnect the agency Google account? Every client dashboard will stop showing Google data until you reconnect.")) return;
    setBusy(true);
    const res = await authFetch("/api/auth/google/disconnect", { method: "POST" });
    setBusy(false);
    if (!res.ok) setMessage({ kind: "error", text: "Could not disconnect. Please try again." });
    onChange();
  };

  return (
    <div className="agency-panel">
      <div className="agency-panel-main">
        <div>
          <h2 className="agency-panel-title">Agency Google account</h2>
          {status?.connected ? (
            <p className="agency-panel-text">
              <span className="admin-status connected"><span className="admin-status-dot" /> Connected</span>{" "}
              as <strong>{status.email}</strong>
              {status.connectedBy && <> · by {status.connectedBy}</>}
            </p>
          ) : (
            <p className="agency-panel-text">
              Not connected. Sign in as <strong>{status?.agencyEmail ?? "the agency account"}</strong> so
              client dashboards can show data from the accounts clients have shared with you.
            </p>
          )}
        </div>
        <div className="agency-panel-actions">
          <button onClick={connect} disabled={busy || !status} className="agency-btn-primary">
            {busy ? "…" : status?.connected ? "Reconnect" : "Connect Google"}
          </button>
          {status?.connected && (
            <button onClick={disconnect} disabled={busy} className="agency-btn-ghost">
              Disconnect
            </button>
          )}
        </div>
      </div>

      {status && (!status.ads.developerToken || !status.ads.managerAccount) && (
        <p className="agency-panel-note">
          Google Ads:{" "}
          {!status.ads.developerToken
            ? "set GOOGLE_ADS_DEVELOPER_TOKEN in Vercel before Ads accounts can be listed or reported on."
            : "no manager account set (GOOGLE_ADS_LOGIN_CUSTOMER_ID), so only Ads accounts the agency email was added to directly will appear."}
        </p>
      )}

      {message && (
        <div className={message.kind === "success" ? "sc-success" : "sc-error"} style={{ marginTop: 14 }}>
          {message.text}
        </div>
      )}
    </div>
  );
}

export const AGENCY_PANEL_STYLES = `
  .agency-panel {
    background: rgba(255,255,255,0.92); border: 1px solid rgba(122, 178, 255, 0.2);
    border-radius: 20px; padding: 24px 26px; margin-bottom: 36px;
    box-shadow: 0 10px 30px rgba(45, 127, 224, 0.07);
  }
  .agency-panel-main { display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
  .agency-panel-title { font-size: 18px; font-weight: 700; color: #16243a; margin-bottom: 6px; }
  .agency-panel-text { font-size: 14px; color: #5a6b82; line-height: 1.5; max-width: 620px; }
  .agency-panel-note { margin-top: 14px; font-size: 13px; color: #a86a0c; background: rgba(244,185,66,0.12); padding: 10px 14px; border-radius: 10px; }
  .agency-panel-actions { display: flex; gap: 10px; }
  .agency-btn-primary {
    padding: 11px 20px; border-radius: 12px; border: none; cursor: pointer; font-family: inherit;
    font-size: 14px; font-weight: 700; color: white;
    background: linear-gradient(135deg, #4a9eff 0%, #2d7fe0 100%);
    box-shadow: 0 6px 16px rgba(74, 158, 255, 0.3);
  }
  .agency-btn-primary:disabled, .agency-btn-ghost:disabled { opacity: 0.6; cursor: default; }
  .agency-btn-ghost {
    padding: 11px 18px; border-radius: 12px; cursor: pointer; font-family: inherit;
    font-size: 14px; font-weight: 600; color: #c0392b;
    background: white; border: 1px solid rgba(192, 57, 43, 0.25);
  }
`;
