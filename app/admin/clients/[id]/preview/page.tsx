"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { authFetch } from "@/lib/api-client";
import { isAdminEmail } from "@/lib/admin";
import { SCRAMBLE_THEME } from "@/lib/scramble-theme";
import { clientServices, AdminClient } from "@/lib/client-status";
import type { ClientUpdate, PublicUpdate } from "@/lib/client-updates";
import ClientDashboardView, { DashboardMetrics, PREVIEW_BAR_STYLES } from "@/components/dashboard/ClientDashboardView";

/**
 * Admin only: the client's dashboard exactly as they see it when they log in
 * (same component, same data, published updates only). Nothing here changes
 * anything for the client.
 */
export default function ViewAsClientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [client, setClient] = useState<AdminClient | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [updates, setUpdates] = useState<PublicUpdate[] | null>(null);

  useEffect(() => {
    authClient.auth.getUser().then(({ data }) => {
      if (isAdminEmail(data.user?.email)) setAuthorized(true);
      else router.replace("/admin-login");
    });
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    authFetch(`/api/admin/clients/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setClient(d.client))
      .catch(() => setNotFound(true));
    authFetch(`/api/admin/clients/${id}/metrics`)
      .then((r) => (r.ok ? r.json() : {}))
      .then(setMetrics)
      .catch(() => setMetrics({}));
    // Same rule the client's own page uses: published items only, and only kind, text and date
    authFetch(`/api/admin/clients/${id}/updates`)
      .then((r) => (r.ok ? r.json() : { updates: [] }))
      .then((d: { updates: ClientUpdate[] }) =>
        setUpdates(
          d.updates
            .filter((u) => u.status === "published" && u.published_at)
            .sort((a, b) => (b.published_at as string).localeCompare(a.published_at as string))
            .map((u) => ({ id: u.id, kind: u.kind, body: u.body, published_at: u.published_at as string }))
        )
      )
      .catch(() => setUpdates([]));
  }, [authorized, id]);

  if (!authorized || (!client && !notFound)) {
    return (
      <div className="sc-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <style>{SCRAMBLE_THEME}</style>
        <p style={{ color: "#5a6b82" }}>Loading…</p>
      </div>
    );
  }
  if (notFound || !client) {
    return (
      <div className="sc-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: 12 }}>
        <style>{SCRAMBLE_THEME}</style>
        <p style={{ color: "#5a6b82" }}>This client couldn&apos;t be found.</p>
        <Link href="/admin" className="sc-link">← Back to all clients</Link>
      </div>
    );
  }

  return (
    <ClientDashboardView
      preview
      companyName={client.company_name}
      services={clientServices(client)}
      metrics={metrics}
      updates={updates}
      nav={
        <nav className="sc-nav">
          <style>{PREVIEW_BAR_STYLES}</style>
          <div className="sc-nav-inner">
            <div className="pv-bar">
              <span className="pv-note">
                Viewing as {client.company_name}: this is exactly what they see when they log in. Only you can see this.
              </span>
              <Link href={`/admin/clients/${id}`} className="sc-link pv-back">← Back to {client.company_name}</Link>
            </div>
          </div>
        </nav>
      }
    />
  );
}
