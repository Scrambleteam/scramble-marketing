"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/api-client";
import { AgencyAccounts } from "@/lib/client-status";
import { AgencyStatus } from "./AgencyGooglePanel";

/**
 * Loads the agency Google connection status and, when connected, everything
 * the agency account can see (used to work out each client's connection lights).
 */
export function useAgencyGoogle() {
  const [status, setStatus] = useState<AgencyStatus | null>(null);
  const [accounts, setAccounts] = useState<AgencyAccounts | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(true);

  const reload = useCallback(async () => {
    setAccountsLoading(true);
    const res = await authFetch("/api/auth/google/status");
    const next: AgencyStatus | null = res.ok ? await res.json() : null;
    setStatus(next);
    if (next?.connected) {
      const accRes = await authFetch("/api/admin/google/accounts");
      setAccounts(accRes.ok ? await accRes.json() : null);
    } else {
      setAccounts(null);
    }
    setAccountsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    reload();
  }, [reload]);

  return { status, accounts, accountsLoading, reload };
}
