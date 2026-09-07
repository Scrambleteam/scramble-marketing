"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   SCRAMBLE — Landing Page
   Pastel blue + white + gold. Modern, professional, 3D depth.
   ═══════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{ background: "#f4f9ff", minHeight: "100vh", overflow: "hidden" }}>
      <style>{scrambleStyles}</style>

      {/* ─── Floating Nav ─── */}
      <nav className="scramble-nav">
        <div className="scramble-nav-inner">
          <div className="scramble-logo">
            <div className="scramble-logo-mark">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L4.5 12.5H11L9 22L18.5 10.5H12L13 2Z" fill="white" />
              </svg>
            </div>
            <span className="scramble-logo-text">Scramble</span>
          </div>
          <div className="scramble-nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="scramble-nav-cta">
            <Link href="/auth/signin" className="scramble-btn-ghost">Sign in</Link>
            <Link href="/pricing" className="scramble-btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="scramble-hero">
        {/* Floating 3D orbs */}
        <div
          className="orb orb-1"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        />
        <div
          className="orb orb-2"
          style={{ transform: `translateY(${scrollY * -0.1}px)` }}
        />
        <div
          className="orb orb-3"
          style={{ transform: `translateY(${scrollY * 0.08}px)` }}
        />

        <div className="scramble-hero-content">
          <div className="scramble-badge-pill">
            <span className="scramble-badge-dot" />
            Marketing intelligence, fully automated
          </div>

          <h1 className="scramble-hero-title">
            Your marketing data,
            <br />
            <span className="scramble-gradient-gold">beautifully unified.</span>
          </h1>

          <p className="scramble-hero-sub">
            Scramble connects your Search Console, Analytics, and Google Ads into one
            elegant dashboard — with automated insights delivered every morning.
            No spreadsheets. No manual reports. Just clarity.
          </p>

          <div className="scramble-hero-actions">
            <Link href="/pricing" className="scramble-btn-primary-lg">
              Start free trial
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <a href="#how" className="scramble-btn-secondary-lg">
              See how it works
            </a>
          </div>

          {/* Floating 3D dashboard preview */}
          <div className="scramble-hero-preview">
            <div className="preview-glass">
              <div className="preview-header">
                <div className="preview-dots">
                  <span /><span /><span />
                </div>
                <div className="preview-title">ACME Corp · Dashboard</div>
              </div>
              <div className="preview-body">
                <div className="preview-stat-row">
                  <div className="preview-stat">
                    <div className="preview-stat-label">Impressions</div>
                    <div className="preview-stat-value">248K</div>
                    <div className="preview-stat-up">▲ 12.4%</div>
                  </div>
                  <div className="preview-stat">
                    <div className="preview-stat-label">Clicks</div>
                    <div className="preview-stat-value">8,420</div>
                    <div className="preview-stat-up">▲ 8.1%</div>
                  </div>
                  <div className="preview-stat">
                    <div className="preview-stat-label">Conversions</div>
                    <div className="preview-stat-value">342</div>
                    <div className="preview-stat-up gold">▲ 23.6%</div>
                  </div>
                </div>
                <div className="preview-chart">
                  <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="preview-chart-svg">
                    <defs>
                      <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7cb9ff" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#7cb9ff" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,90 C50,70 80,40 120,50 C160,60 200,20 240,30 C280,40 320,15 360,25 L400,20 L400,120 L0,120 Z"
                      fill="url(#chartFill)"
                    />
                    <path
                      d="M0,90 C50,70 80,40 120,50 C160,60 200,20 240,30 C280,40 320,15 360,25 L400,20"
                      fill="none"
                      stroke="#4a9eff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust bar ─── */}
      <section className="scramble-trust">
        <p>Connecting the tools you already use</p>
        <div className="scramble-trust-logos">
          <span>Search Console</span>
          <span className="dot">·</span>
          <span>Google Analytics</span>
          <span className="dot">·</span>
          <span>Google Ads</span>
          <span className="dot">·</span>
          <span>SEMrush</span>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="scramble-features">
        <div className="scramble-section-head">
          <div className="scramble-eyebrow">Features</div>
          <h2 className="scramble-section-title">
            Everything you need to prove marketing works
          </h2>
          <p className="scramble-section-sub">
            Live data, automated insights, and beautiful reports — all in one place.
          </p>
        </div>

        <div className="scramble-feature-grid">
          {FEATURES.map((f, i) => (
            <div className="scramble-feature-card" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="scramble-feature-icon" style={{ background: f.gradient }}>
                {f.icon}
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how" className="scramble-how">
        <div className="scramble-section-head">
          <div className="scramble-eyebrow">How it works</div>
          <h2 className="scramble-section-title">Live in minutes, not weeks</h2>
        </div>

        <div className="scramble-steps">
          {STEPS.map((s, i) => (
            <div className="scramble-step" key={i}>
              <div className="scramble-step-num">{i + 1}</div>
              <div className="scramble-step-content">
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
              {i < STEPS.length - 1 && <div className="scramble-step-line" />}
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA band ─── */}
      <section className="scramble-cta-band">
        <div className="scramble-cta-glass">
          <h2>Ready to see your marketing clearly?</h2>
          <p>Start your free trial today. No card required to explore.</p>
          <Link href="/pricing" className="scramble-btn-primary-lg white">
            View pricing
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="scramble-footer">
        <div className="scramble-footer-inner">
          <div className="scramble-footer-brand">
            <div className="scramble-logo-mark small">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L4.5 12.5H11L9 22L18.5 10.5H12L13 2Z" fill="white" />
              </svg>
            </div>
            <span>Scramble</span>
          </div>
          <div className="scramble-footer-links">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <span className="dot">·</span>
            <Link href="/cookie-policy">Cookie Policy</Link>
            <span className="dot">·</span>
            <Link href="/terms">Terms of Service</Link>
          </div>
          <p>© 2026 Scramble Marketing Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

/* ─── Data ─── */

const FEATURES = [
  {
    title: "Search Console Intelligence",
    desc: "Track keyword rankings, impressions, and clicks with trend analysis that surfaces what's moving.",
    gradient: "linear-gradient(135deg, #7cb9ff 0%, #4a9eff 100%)",
    icon: <span style={{ fontSize: 24 }}>🔍</span>,
  },
  {
    title: "Analytics That Speak",
    desc: "Traffic, sessions, and conversions translated into plain-English insights you can act on.",
    gradient: "linear-gradient(135deg, #a5c8ff 0%, #6ba8ff 100%)",
    icon: <span style={{ fontSize: 24 }}>📈</span>,
  },
  {
    title: "Ads Performance",
    desc: "See campaign spend, conversions, and ROAS across every ad — know what's working instantly.",
    gradient: "linear-gradient(135deg, #ffd88a 0%, #f4b942 100%)",
    icon: <span style={{ fontSize: 24 }}>💰</span>,
  },
  {
    title: "Automated Reports",
    desc: "Fresh reports delivered every morning. Weekly summaries. Monthly deep-dives. All automatic.",
    gradient: "linear-gradient(135deg, #7cb9ff 0%, #4a9eff 100%)",
    icon: <span style={{ fontSize: 24 }}>⚡</span>,
  },
  {
    title: "One Secure Connection",
    desc: "Connect your Google account once. We handle the rest — securely, with tokens encrypted at rest.",
    gradient: "linear-gradient(135deg, #a5c8ff 0%, #6ba8ff 100%)",
    icon: <span style={{ fontSize: 24 }}>🔐</span>,
  },
  {
    title: "Built for Growth",
    desc: "From startups to agencies — scale from one property to hundreds without breaking a sweat.",
    gradient: "linear-gradient(135deg, #ffd88a 0%, #f4b942 100%)",
    icon: <span style={{ fontSize: 24 }}>🚀</span>,
  },
];

const STEPS = [
  {
    title: "Sign up & choose a plan",
    desc: "Pick the tier that fits your needs. Setup takes under two minutes.",
  },
  {
    title: "Connect your Google account",
    desc: "One secure OAuth connection unlocks Search Console, Analytics, and Ads.",
  },
  {
    title: "Watch your dashboard come alive",
    desc: "Live data flows in automatically. Insights and reports generate on schedule.",
  },
];

/* ─── Styles ─── */

const scrambleStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .scramble-nav, .scramble-hero, .scramble-features, .scramble-how,
  .scramble-cta-band, .scramble-footer, .scramble-trust {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  /* ─── Nav ─── */
  .scramble-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    padding: 18px 0;
    background: rgba(244, 249, 255, 0.72);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(122, 178, 255, 0.12);
  }
  .scramble-nav-inner {
    max-width: 1180px; margin: 0 auto; padding: 0 28px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .scramble-logo { display: flex; align-items: center; gap: 10px; }
  .scramble-logo-mark {
    width: 38px; height: 38px; border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #4a9eff 0%, #2d7fe0 100%);
    box-shadow: 0 6px 16px rgba(74, 158, 255, 0.35), inset 0 1px 0 rgba(255,255,255,0.4);
  }
  .scramble-logo-mark.small { width: 30px; height: 30px; border-radius: 9px; }
  .scramble-logo-text {
    font-size: 20px; font-weight: 800; letter-spacing: -0.5px;
    background: linear-gradient(135deg, #2d7fe0 0%, #1a5fb0 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .scramble-nav-links { display: flex; gap: 34px; }
  .scramble-nav-links a {
    color: #4a5a72; font-size: 15px; font-weight: 500; text-decoration: none;
    transition: color 0.2s;
  }
  .scramble-nav-links a:hover { color: #2d7fe0; }
  .scramble-nav-cta { display: flex; align-items: center; gap: 14px; }

  .scramble-btn-ghost {
    color: #4a5a72; font-size: 15px; font-weight: 600; text-decoration: none;
    padding: 9px 16px; border-radius: 10px; transition: all 0.2s;
  }
  .scramble-btn-ghost:hover { color: #2d7fe0; background: rgba(122, 178, 255, 0.1); }

  .scramble-btn-primary {
    color: white; font-size: 15px; font-weight: 700; text-decoration: none;
    padding: 10px 20px; border-radius: 11px;
    background: linear-gradient(135deg, #4a9eff 0%, #2d7fe0 100%);
    box-shadow: 0 8px 20px rgba(74, 158, 255, 0.35), inset 0 1px 0 rgba(255,255,255,0.3);
    transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
  }
  .scramble-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(74, 158, 255, 0.45), inset 0 1px 0 rgba(255,255,255,0.3);
  }

  /* ─── Hero ─── */
  .scramble-hero {
    position: relative;
    padding: 180px 28px 100px;
    background:
      radial-gradient(ellipse 80% 50% at 50% 0%, rgba(122, 178, 255, 0.25) 0%, transparent 60%),
      linear-gradient(180deg, #f4f9ff 0%, #eaf3ff 100%);
    overflow: hidden;
  }
  .scramble-hero-content {
    max-width: 900px; margin: 0 auto; text-align: center;
    position: relative; z-index: 2;
  }
  .scramble-badge-pill {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 18px; border-radius: 999px;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(122, 178, 255, 0.3);
    color: #2d7fe0; font-size: 14px; font-weight: 600;
    box-shadow: 0 4px 14px rgba(74, 158, 255, 0.12);
    margin-bottom: 28px;
  }
  .scramble-badge-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #f4b942; box-shadow: 0 0 10px #f4b942;
    animation: scramblePulse 2s ease-in-out infinite;
  }
  @keyframes scramblePulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

  .scramble-hero-title {
    font-size: 64px; font-weight: 800; line-height: 1.05; letter-spacing: -2px;
    color: #16243a; margin-bottom: 24px;
  }
  .scramble-gradient-gold {
    background: linear-gradient(135deg, #f4b942 0%, #e89b1f 50%, #4a9eff 120%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .scramble-hero-sub {
    font-size: 20px; line-height: 1.6; color: #5a6b82;
    max-width: 620px; margin: 0 auto 40px;
  }
  .scramble-hero-actions {
    display: flex; gap: 16px; justify-content: center; align-items: center;
    margin-bottom: 72px; flex-wrap: wrap;
  }
  .scramble-btn-primary-lg {
    display: inline-flex; align-items: center; gap: 10px;
    color: white; font-size: 17px; font-weight: 700; text-decoration: none;
    padding: 16px 30px; border-radius: 14px;
    background: linear-gradient(135deg, #4a9eff 0%, #2d7fe0 100%);
    box-shadow: 0 12px 30px rgba(74, 158, 255, 0.4), inset 0 1px 0 rgba(255,255,255,0.3);
    transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
  }
  .scramble-btn-primary-lg:hover {
    transform: translateY(-3px);
    box-shadow: 0 18px 40px rgba(74, 158, 255, 0.5), inset 0 1px 0 rgba(255,255,255,0.3);
  }
  .scramble-btn-primary-lg.white {
    background: white; color: #2d7fe0;
    box-shadow: 0 12px 30px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.6);
  }
  .scramble-btn-secondary-lg {
    display: inline-flex; align-items: center; gap: 10px;
    color: #2d7fe0; font-size: 17px; font-weight: 700; text-decoration: none;
    padding: 16px 30px; border-radius: 14px;
    background: rgba(255,255,255,0.8);
    border: 1px solid rgba(122, 178, 255, 0.35);
    box-shadow: 0 6px 18px rgba(74, 158, 255, 0.1);
    transition: all 0.3s;
  }
  .scramble-btn-secondary-lg:hover {
    background: white; transform: translateY(-2px);
    box-shadow: 0 10px 26px rgba(74, 158, 255, 0.18);
  }

  /* ─── Floating orbs (3D depth) ─── */
  .orb { position: absolute; border-radius: 50%; filter: blur(1px); z-index: 1; }
  .orb-1 {
    width: 180px; height: 180px; top: 140px; left: 8%;
    background: radial-gradient(circle at 30% 30%, #a5c8ff, #4a9eff);
    box-shadow: 0 30px 80px rgba(74, 158, 255, 0.4), inset -10px -10px 30px rgba(45, 127, 224, 0.5), inset 8px 8px 20px rgba(255,255,255,0.6);
    opacity: 0.85; animation: scrambleFloat 8s ease-in-out infinite;
  }
  .orb-2 {
    width: 120px; height: 120px; top: 260px; right: 10%;
    background: radial-gradient(circle at 30% 30%, #ffe4a8, #f4b942);
    box-shadow: 0 24px 60px rgba(244, 185, 66, 0.4), inset -8px -8px 24px rgba(232, 155, 31, 0.5), inset 6px 6px 16px rgba(255,255,255,0.7);
    opacity: 0.8; animation: scrambleFloat 10s ease-in-out infinite reverse;
  }
  .orb-3 {
    width: 90px; height: 90px; bottom: 120px; left: 18%;
    background: radial-gradient(circle at 30% 30%, #cfe4ff, #7cb9ff);
    box-shadow: 0 18px 46px rgba(124, 185, 255, 0.4), inset -6px -6px 18px rgba(74, 158, 255, 0.4), inset 5px 5px 14px rgba(255,255,255,0.7);
    opacity: 0.7; animation: scrambleFloat 7s ease-in-out infinite;
  }
  @keyframes scrambleFloat {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-24px) rotate(6deg); }
  }

  /* ─── Hero preview (3D dashboard) ─── */
  .scramble-hero-preview {
    perspective: 1600px;
    margin-top: 20px;
  }
  .preview-glass {
    max-width: 720px; margin: 0 auto;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.9);
    border-radius: 20px;
    box-shadow:
      0 40px 90px rgba(45, 127, 224, 0.22),
      0 12px 30px rgba(45, 127, 224, 0.12),
      inset 0 1px 0 rgba(255,255,255,0.9);
    overflow: hidden;
    transform: rotateX(8deg) rotateY(-2deg);
    transition: transform 0.5s cubic-bezier(0.4,0,0.2,1);
  }
  .preview-glass:hover { transform: rotateX(2deg) rotateY(0deg) translateY(-6px); }
  .preview-header {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 20px;
    background: linear-gradient(135deg, rgba(122,178,255,0.15), rgba(122,178,255,0.05));
    border-bottom: 1px solid rgba(122, 178, 255, 0.15);
  }
  .preview-dots { display: flex; gap: 7px; }
  .preview-dots span { width: 11px; height: 11px; border-radius: 50%; }
  .preview-dots span:nth-child(1) { background: #ff8a80; }
  .preview-dots span:nth-child(2) { background: #ffd88a; }
  .preview-dots span:nth-child(3) { background: #7cb9ff; }
  .preview-title { font-size: 13px; font-weight: 600; color: #4a5a72; }
  .preview-body { padding: 24px; }
  .preview-stat-row { display: flex; gap: 16px; margin-bottom: 24px; }
  .preview-stat {
    flex: 1; padding: 16px; border-radius: 14px;
    background: rgba(255,255,255,0.9);
    border: 1px solid rgba(122, 178, 255, 0.14);
    box-shadow: 0 4px 14px rgba(45, 127, 224, 0.08), inset 0 1px 0 rgba(255,255,255,0.8);
    text-align: left;
  }
  .preview-stat-label { font-size: 12px; color: #8a97ab; font-weight: 500; margin-bottom: 6px; }
  .preview-stat-value { font-size: 26px; font-weight: 800; color: #16243a; letter-spacing: -1px; }
  .preview-stat-up { font-size: 12px; font-weight: 700; color: #34c77b; margin-top: 4px; }
  .preview-stat-up.gold { color: #e89b1f; }
  .preview-chart {
    border-radius: 14px; overflow: hidden;
    background: rgba(255,255,255,0.5);
    border: 1px solid rgba(122, 178, 255, 0.1);
    padding: 8px;
  }
  .preview-chart-svg { width: 100%; height: 120px; display: block; }

  /* ─── Trust ─── */
  .scramble-trust {
    text-align: center; padding: 48px 28px;
    background: #f4f9ff;
  }
  .scramble-trust p { font-size: 14px; color: #8a97ab; font-weight: 500; margin-bottom: 18px; }
  .scramble-trust-logos {
    display: flex; gap: 18px; justify-content: center; align-items: center;
    flex-wrap: wrap; font-size: 17px; font-weight: 700; color: #b0bccd;
  }
  .scramble-trust-logos .dot { color: #d0dae8; }

  /* ─── Features ─── */
  .scramble-features { padding: 90px 28px; background: linear-gradient(180deg, #f4f9ff, #ffffff); }
  .scramble-section-head { text-align: center; max-width: 640px; margin: 0 auto 60px; }
  .scramble-eyebrow {
    display: inline-block; font-size: 13px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; color: #4a9eff; margin-bottom: 14px;
  }
  .scramble-section-title {
    font-size: 42px; font-weight: 800; line-height: 1.15; letter-spacing: -1px;
    color: #16243a; margin-bottom: 16px;
  }
  .scramble-section-sub { font-size: 18px; color: #5a6b82; line-height: 1.6; }

  .scramble-feature-grid {
    max-width: 1120px; margin: 0 auto;
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
  }
  .scramble-feature-card {
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(122, 178, 255, 0.14);
    border-radius: 20px; padding: 32px 28px;
    box-shadow: 0 10px 30px rgba(45, 127, 224, 0.06), inset 0 1px 0 rgba(255,255,255,0.9);
    transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
    animation: scrambleRise 0.6s ease both;
  }
  .scramble-feature-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 50px rgba(45, 127, 224, 0.14), inset 0 1px 0 rgba(255,255,255,0.9);
  }
  @keyframes scrambleRise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .scramble-feature-icon {
    width: 56px; height: 56px; border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px;
    box-shadow: 0 8px 20px rgba(74, 158, 255, 0.25), inset 0 1px 0 rgba(255,255,255,0.4);
  }
  .scramble-feature-card h3 { font-size: 20px; font-weight: 700; color: #16243a; margin-bottom: 10px; }
  .scramble-feature-card p { font-size: 15px; line-height: 1.6; color: #5a6b82; }

  /* ─── How ─── */
  .scramble-how { padding: 90px 28px; background: white; }
  .scramble-steps { max-width: 780px; margin: 0 auto; }
  .scramble-step {
    display: flex; gap: 24px; position: relative; padding-bottom: 44px;
  }
  .scramble-step:last-child { padding-bottom: 0; }
  .scramble-step-num {
    flex-shrink: 0; width: 52px; height: 52px; border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; font-weight: 800; color: white;
    background: linear-gradient(135deg, #4a9eff 0%, #2d7fe0 100%);
    box-shadow: 0 8px 22px rgba(74, 158, 255, 0.35), inset 0 1px 0 rgba(255,255,255,0.3);
    z-index: 2;
  }
  .scramble-step-line {
    position: absolute; left: 26px; top: 52px; bottom: 0; width: 2px;
    background: linear-gradient(180deg, rgba(74,158,255,0.4), rgba(74,158,255,0.08));
  }
  .scramble-step-content { padding-top: 6px; }
  .scramble-step-content h3 { font-size: 21px; font-weight: 700; color: #16243a; margin-bottom: 8px; }
  .scramble-step-content p { font-size: 16px; line-height: 1.6; color: #5a6b82; }

  /* ─── CTA band ─── */
  .scramble-cta-band { padding: 90px 28px; background: linear-gradient(180deg, white, #eaf3ff); }
  .scramble-cta-glass {
    max-width: 820px; margin: 0 auto; text-align: center;
    padding: 64px 48px; border-radius: 28px;
    background: linear-gradient(135deg, #4a9eff 0%, #2d7fe0 100%);
    box-shadow: 0 30px 70px rgba(45, 127, 224, 0.35), inset 0 1px 0 rgba(255,255,255,0.25);
    position: relative; overflow: hidden;
  }
  .scramble-cta-glass::before {
    content: ''; position: absolute; top: -50%; right: -20%;
    width: 400px; height: 400px; border-radius: 50%;
    background: radial-gradient(circle, rgba(244,185,66,0.4), transparent 70%);
  }
  .scramble-cta-glass h2 {
    font-size: 40px; font-weight: 800; color: white; letter-spacing: -1px;
    margin-bottom: 14px; position: relative;
  }
  .scramble-cta-glass p { font-size: 18px; color: rgba(255,255,255,0.9); margin-bottom: 32px; position: relative; }

  /* ─── Footer ─── */
  .scramble-footer { padding: 40px 28px; background: #eaf3ff; border-top: 1px solid rgba(122,178,255,0.15); }
  .scramble-footer-inner {
    max-width: 1120px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
  }
  .scramble-footer-brand { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 18px; color: #2d7fe0; }
  .scramble-footer p { font-size: 14px; color: #8a97ab; }
  .scramble-footer-links { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .scramble-footer-links a {
    color: #5a6b82; font-size: 14px; font-weight: 600; text-decoration: none;
    transition: color 0.2s;
  }
  .scramble-footer-links a:hover { color: #2d7fe0; }
  .scramble-footer-links .dot { color: #d0dae8; }

  /* ─── Responsive ─── */
  @media (max-width: 860px) {
    .scramble-nav-links { display: none; }
    .scramble-hero-title { font-size: 42px; letter-spacing: -1px; }
    .scramble-hero-sub { font-size: 17px; }
    .scramble-feature-grid { grid-template-columns: 1fr; }
    .scramble-section-title { font-size: 32px; }
    .preview-stat-row { flex-direction: column; }
    .scramble-cta-glass { padding: 44px 28px; }
    .scramble-cta-glass h2 { font-size: 30px; }
    .preview-glass { transform: none; }
  }
`;
