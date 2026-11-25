"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api-client";

/** Plain-text version for admins to send to a client */
export function metaShareText(businessId: string | null): string {
  return [
    "Please share your Meta ad account with Scramble:",
    "",
    "1. Open business.facebook.com and go to Business Settings → Users → Partners.",
    "2. Click Add → \"Give a partner access to your assets\".",
    `3. Enter Scramble's Business ID: ${businessId ?? "(ask your Scramble contact)"}`,
    "4. Choose your Ad account and give us \"View performance\" access.",
    "5. Save, then tell us it's done.",
  ].join("\n");
}

/**
 * How a client shares their Meta ad account with Scramble (Partners), shown
 * wherever the client is asked to connect Meta. Fetches our Business ID.
 */
export default function MetaShareSteps() {
  const [businessId, setBusinessId] = useState<string | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    authFetch("/api/meta/partner-info")
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: { businessId?: string | null }) => setBusinessId(d.businessId ?? null))
      .catch(() => setBusinessId(null));
  }, []);

  const copy = async () => {
    if (!businessId) return;
    try {
      await navigator.clipboard.writeText(businessId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked; the ID is visible to copy by hand
    }
  };

  return (
    <div className="meta-share">
      {businessId && (
        <div className="meta-share-id">
          <span>Scramble&apos;s Meta Business ID</span>
          <code>{businessId}</code>
          <button type="button" onClick={copy} className="meta-share-copy">{copied ? "Copied" : "Copy"}</button>
        </div>
      )}
      <ol className="meta-share-steps">
        <li>Open <strong>business.facebook.com</strong> and go to <strong>Business Settings → Users → Partners</strong>.</li>
        <li>Click <strong>Add</strong> and choose <strong>Give a partner access to your assets</strong>.</li>
        <li>Enter Scramble&apos;s Business ID{businessId ? <> (<code>{businessId}</code>)</> : " (your Scramble team will send it)"}.</li>
        <li>Choose your <strong>Ad account</strong> and give us <strong>View performance</strong> access, then save.</li>
        <li>Let your Scramble team know. We&apos;ll connect it and your results will appear here.</li>
      </ol>
    </div>
  );
}

export const META_SHARE_STYLES = `
  .meta-share-id { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 12px 14px; border-radius: 12px; background: rgba(24,119,242,0.07); font-size: 13px; color: #4a5a72; margin: 14px 0 4px; }
  .meta-share-id code { font-size: 15px; font-weight: 700; color: #16243a; }
  .meta-share-copy { margin-left: auto; padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(24,119,242,0.3); background: white; color: #1877f2; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
  .meta-share-steps { margin: 12px 0 0 18px; padding: 0; font-size: 14px; color: #4a5a72; line-height: 1.6; }
  .meta-share-steps li { margin-bottom: 6px; }
  .meta-share-steps code { font-weight: 700; color: #16243a; }
`;
