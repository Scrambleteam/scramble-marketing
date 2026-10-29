"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { isAdminEmail } from "@/lib/admin";
import { SCRAMBLE_THEME } from "@/lib/scramble-theme";

/**
 * Admin page frame: checks the signed-in user is an admin (redirecting to
 * /admin-login otherwise), then renders the admin nav and the page.
 * Children only mount once access is confirmed, so their data fetches run
 * with a valid admin session. The API routes enforce admin access too.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    authClient.auth.getUser().then(({ data }) => {
      if (isAdminEmail(data.user?.email)) setAuthorized(true);
      else router.replace("/admin-login");
    });
  }, [router]);

  const handleSignOut = async () => {
    await authClient.auth.signOut();
    router.push("/admin-login");
  };

  return (
    <div className="sc-root">
      <style>{SCRAMBLE_THEME}</style>
      <style>{ADMIN_SHELL_STYLES}</style>

      {!authorized ? (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "#5a6b82" }}>Checking access...</p>
        </div>
      ) : (
        <>
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
          <div className="admin-wrap">{children}</div>
        </>
      )}
    </div>
  );
}

const ADMIN_SHELL_STYLES = `
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
  .admin-wrap { max-width: 1120px; margin: 0 auto; padding: 120px 28px 80px; }
  .sc-eyebrow-admin {
    display: inline-block; font-size: 13px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; color: #4a9eff; margin-bottom: 10px;
  }
  .admin-title { font-size: 36px; font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; }
  .admin-subtitle { font-size: 16px; color: #5a6b82; max-width: 620px; }

  /* Status pieces shared by the hub and workspace */
  .badge { display: inline-flex; align-items: center; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; white-space: nowrap; }
  .badge.good { color: #1a8a4f; background: rgba(52, 199, 123, 0.12); }
  .badge.warn { color: #a86a0c; background: rgba(244, 185, 66, 0.16); }
  .badge.bad { color: #c0392b; background: rgba(255, 138, 128, 0.16); }
  .badge.muted { color: #5a6b82; background: rgba(122, 178, 255, 0.12); }
  .badge.plan { color: #2d7fe0; background: rgba(74, 158, 255, 0.1); }

  .lights { display: flex; flex-wrap: wrap; gap: 8px 14px; }
  .light { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; color: #3a4a62; }
  .light-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; box-sizing: border-box; }
  .light-dot.live { background: #34c77b; }
  .light-dot.unverified { background: #9fc7f5; }
  .light-dot.broken { background: #e74c3c; }
  .light-dot.not_assigned, .light-dot.waiting { background: transparent; border: 2px solid #c3cddb; }

  @media (max-width: 700px) {
    .admin-title { font-size: 28px; }
    .admin-wrap { padding: 110px 16px 60px; }
  }
`;
