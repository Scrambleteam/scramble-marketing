"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { SCRAMBLE_THEME } from "@/lib/scramble-theme";
import { getTier, TIERS } from "@/lib/tiers";

function SignupInner() {
  const router = useRouter();
  const params = useSearchParams();
  const tierKey = (params.get("tier") || "full") as "seo" | "ads" | "full";
  const tier = getTier(tierKey) || TIERS[1];

  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Create the Supabase auth user
      const { data: authData, error: authError } = await authClient.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      const authUserId = authData.user?.id;

      // 2. Create the scramble_users profile via API (uses service role)
      const res = await fetch("/api/scramble/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authUserId,
          email,
          companyName: company,
          tier: tierKey,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      // 3. Redirect to onboarding
      router.push(`/onboarding?email=${encodeURIComponent(email)}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="sc-root">
      <style>{SCRAMBLE_THEME}</style>
      <style>{signupStyles}</style>

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
          <Link href="/auth/signin" className="sc-link" style={{ fontSize: 15 }}>
            Sign in
          </Link>
        </div>
      </nav>

      <div className="signup-wrap">
        <div className="sc-card signup-card">
          <div className="signup-tier-tag">
            <span className="signup-tier-dot" />
            {tier.name} plan · {tier.price}/mo
          </div>

          <h1 className="signup-title">Create your account</h1>
          <p className="signup-sub">Start your free trial — no card required.</p>

          <form onSubmit={handleSignup} className="signup-form">
            <div>
              <label className="sc-label">Company name</label>
              <input
                className="sc-input"
                type="text"
                placeholder="Acme Corp"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="sc-label">Work email</label>
              <input
                className="sc-input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="sc-label">Password</label>
              <input
                className="sc-input"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            {error && <div className="sc-error">{error}</div>}

            <button type="submit" className="sc-btn-primary" disabled={loading}>
              {loading ? "Creating account..." : "Create account →"}
            </button>

            <p className="signup-legal">
              By signing up, you agree to our{" "}
              <Link href="/privacy-policy">Privacy Policy</Link> and{" "}
              <Link href="/cookie-policy">Cookie Policy</Link>.
            </p>
          </form>

          <p className="signup-foot">
            Already have an account? <Link href="/auth/signin" className="sc-link">Sign in</Link>
          </p>
        </div>

        {/* Tier summary card */}
        <div className="signup-summary">
          <h3>You're signing up for</h3>
          <div className="signup-summary-tier">{tier.name}</div>
          <p className="signup-summary-tagline">{tier.tagline}</p>
          <ul>
            {tier.features.map((f, i) => (
              <li key={i}>
                <span className="signup-summary-check">✓</span> {f}
              </li>
            ))}
          </ul>
          <Link href="/pricing" className="sc-link" style={{ fontSize: 14 }}>
            ← Change plan
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupInner />
    </Suspense>
  );
}

const signupStyles = `
  .signup-wrap {
    max-width: 940px; margin: 0 auto; padding: 150px 28px 80px;
    display: grid; grid-template-columns: 1fr 340px; gap: 32px; align-items: start;
  }
  .signup-card { padding: 40px; }
  .signup-tier-tag {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 7px 16px; border-radius: 999px;
    background: rgba(74, 158, 255, 0.1); color: #2d7fe0;
    font-size: 14px; font-weight: 600; margin-bottom: 24px;
  }
  .signup-tier-dot { width: 8px; height: 8px; border-radius: 50%; background: #f4b942; box-shadow: 0 0 10px #f4b942; }
  .signup-title { font-size: 32px; font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; }
  .signup-sub { font-size: 16px; color: #5a6b82; margin-bottom: 32px; }
  .signup-form { display: flex; flex-direction: column; gap: 20px; }
  .signup-foot { text-align: center; margin-top: 24px; font-size: 15px; color: #5a6b82; }
  .signup-legal {
    text-align: center; font-size: 13px; color: #8a97ab; line-height: 1.5;
  }
  .signup-legal a {
    color: #2d7fe0; text-decoration: underline; text-underline-offset: 2px;
    font-weight: 600; transition: color 0.2s;
  }
  .signup-legal a:hover { color: #4a9eff; }

  .signup-summary {
    background: linear-gradient(135deg, rgba(74,158,255,0.06), rgba(244,185,66,0.06));
    border: 1px solid rgba(122, 178, 255, 0.18);
    border-radius: 24px; padding: 32px 28px;
    box-shadow: 0 12px 30px rgba(45, 127, 224, 0.06);
    position: sticky; top: 120px;
  }
  .signup-summary h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #8a97ab; font-weight: 700; margin-bottom: 14px; }
  .signup-summary-tier { font-size: 26px; font-weight: 800; color: #16243a; margin-bottom: 6px; }
  .signup-summary-tagline { font-size: 14px; color: #5a6b82; margin-bottom: 22px; }
  .signup-summary ul { list-style: none; margin: 0 0 22px; padding: 0; }
  .signup-summary li { font-size: 14px; color: #3a4a62; margin-bottom: 12px; display: flex; gap: 10px; }
  .signup-summary-check { color: #34c77b; font-weight: 800; }

  @media (max-width: 820px) {
    .signup-wrap { grid-template-columns: 1fr; }
    .signup-summary { position: static; order: -1; }
    .signup-card { padding: 32px 24px; }
  }
`;
