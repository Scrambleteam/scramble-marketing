"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { authFetch } from "@/lib/api-client";
import { SCRAMBLE_THEME } from "@/lib/scramble-theme";
import { servicesForTier, TierKey, ServiceKey } from "@/lib/tiers";
import type { PublicUpdate } from "@/lib/client-updates";
import ClientDashboardView, { DashboardMetrics } from "@/components/dashboard/ClientDashboardView";

interface Profile {
  email: string;
  company_name: string;
  tier: TierKey;
  services: ServiceKey[];
}

export default function ClientDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  // Published updates only: what the Scramble team has chosen to share
  const [updates, setUpdates] = useState<PublicUpdate[] | null>(null);

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

        authFetch("/api/dashboard/updates")
          .then((r) => (r.ok ? r.json() : { updates: [] }))
          .then((d) => setUpdates(d.updates))
          .catch(() => setUpdates([]));
      }
      setLoading(false);
    })();
  }, [router]);

  const handleSignOut = async () => {
    await authClient.auth.signOut();
    router.push("/landing");
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

  return (
    <ClientDashboardView
      companyName={profile.company_name}
      services={profile.services?.length ? profile.services : servicesForTier(profile.tier)}
      metrics={metrics}
      updates={updates}
      nav={
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
      }
    />
  );
}
