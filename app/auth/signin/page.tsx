"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { SCRAMBLE_THEME } from "@/lib/scramble-theme";

export default function SigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="sc-root">
      <style>{SCRAMBLE_THEME}</style>
      <style>{signinStyles}</style>

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
          <Link href="/pricing" className="sc-link" style={{ fontSize: 15 }}>
            Pricing
          </Link>
        </div>
      </nav>

      <div className="signin-wrap">
        <div className="sc-card signin-card">
          <h1 className="signin-title">Welcome back</h1>
          <p className="signin-sub">Sign in to your Scramble dashboard.</p>

          <form onSubmit={handleSignin} className="signin-form">
            <div>
              <label className="sc-label">Email</label>
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
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="sc-error">{error}</div>}

            <button type="submit" className="sc-btn-primary" disabled={loading}>
              {loading ? "Signing in..." : "Sign in →"}
            </button>

            <p style={{ textAlign: 'center', marginTop: 4 }}>
              <Link href="/auth/forgot-password" className="sc-link" style={{ fontSize: 14, color: '#5a6b82' }}>Forgot password?</Link>
            </p>
          </form>

          <p className="signin-foot">
            New to Scramble? <Link href="/pricing" className="sc-link">Choose a plan</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const signinStyles = `
  .signin-wrap { max-width: 440px; margin: 0 auto; padding: 170px 28px 80px; }
  .signin-card { padding: 40px; }
  .signin-title { font-size: 32px; font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; }
  .signin-sub { font-size: 16px; color: #5a6b82; margin-bottom: 32px; }
  .signin-form { display: flex; flex-direction: column; gap: 20px; }
  .signin-foot { text-align: center; margin-top: 24px; font-size: 15px; color: #5a6b82; }
  @media (max-width: 500px) { .signin-card { padding: 32px 24px; } }
`;
