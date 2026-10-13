import type { Metadata } from "next";
import Link from "next/link";
import { SCRAMBLE_THEME } from "@/lib/scramble-theme";
import { PublicNav, PublicFooter, PUBLIC_CHROME_STYLES } from "@/components/PublicSiteChrome";

export const metadata: Metadata = {
  title: "About Scramble — Digital marketing, managed with clarity",
  description:
    "Scramble is a digital marketing agency. We plan, run and optimise your campaigns across search, paid media and social.",
};

export default function InfoPage() {
  return (
    <div className="sc-root">
      <style>{SCRAMBLE_THEME}</style>
      <style>{PUBLIC_CHROME_STYLES}</style>
      <style>{infoStyles}</style>

      <PublicNav />

      {/* Header */}
      <section className="info-head">
        <div className="sc-eyebrow">About Scramble</div>
        <h1 className="info-title">
          Digital marketing, <span className="sc-gradient-gold">managed with clarity</span>
        </h1>
        <p className="info-sub">
          Scramble is a digital marketing agency. We plan, run and optimise your campaigns
          across search, paid media and social, and give you a secure place to follow the
          results as they happen.
        </p>
      </section>

      {/* Our services */}
      <section className="info-section">
        <div className="info-card">
          <h2>Our services</h2>
          <p>
            We manage your digital marketing end to end, bringing together search visibility,
            paid advertising and social campaigns under one strategy.
          </p>
          <ul className="info-services">
            {SERVICES.map((s) => (
              <li key={s}>
                <span className="info-check">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Your results */}
      <section className="info-section">
        <div className="info-card">
          <h2>Your results, on your terms</h2>
          <p>
            Your performance data is available through your own Scramble login, at any time.
            Key metrics and a weekly summary give you a clear view of what&apos;s working,
            without waiting for the next report.
          </p>
        </div>
      </section>

      {/* How we work */}
      <section className="info-section">
        <h2 className="info-section-title">How we work with you</h2>
        <div className="info-steps">
          {STEPS.map((s, i) => (
            <div className="info-step" key={s.title}>
              <div className="info-step-num">{i + 1}</div>
              <div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why we connect */}
      <section className="info-section">
        <div className="info-card">
          <h2>Why we connect your accounts</h2>
          <p>
            A live connection means your reporting is accurate, current and drawn from the same
            source we use to make decisions. It removes manual reporting and gives both sides a
            shared view of progress.
          </p>
        </div>
      </section>

      {/* CTAs */}
      <section className="info-cta">
        <Link href="/contact" className="sc-btn-primary info-cta-btn">
          Start a conversation
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <Link href="/pricing" className="info-cta-secondary">
          View pricing
        </Link>
      </section>

      <PublicFooter />
    </div>
  );
}

// TODO(content): confirm the service list before publishing.
const SERVICES = [
  "Search visibility (SEO)",
  "Paid advertising",
  "Social campaigns",
];

const STEPS = [
  {
    title: "Introduction",
    desc: "We start with a conversation about your business, your goals and your current marketing.",
  },
  {
    title: "Connection",
    desc: "With your permission, we link your Google and Meta accounts. This lets us work from your actual data, not estimates. You keep full control and can disconnect at any time.",
  },
  {
    title: "Ongoing visibility",
    desc: "Log in whenever you need to see performance, and we keep your strategy aligned with the results.",
  },
];

const infoStyles = `
  .sc-eyebrow {
    display: inline-block; font-size: 13px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; color: #4a9eff; margin-bottom: 14px;
  }
  .info-head { text-align: center; padding: 150px 28px 40px; max-width: 760px; margin: 0 auto; }
  .info-title { font-size: 48px; font-weight: 800; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 18px; }
  .info-sub { font-size: 19px; color: #5a6b82; line-height: 1.6; }

  .info-section { max-width: 820px; margin: 0 auto; padding: 20px 28px; }
  .info-card {
    background: rgba(255,255,255,0.92); backdrop-filter: blur(16px);
    border: 1px solid rgba(122, 178, 255, 0.16); border-radius: 24px; padding: 36px 32px;
    box-shadow: 0 16px 40px rgba(45, 127, 224, 0.08), inset 0 1px 0 rgba(255,255,255,0.9);
  }
  .info-card h2, .info-section-title { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 12px; }
  .info-section-title { text-align: center; margin: 20px 0 28px; font-size: 32px; }
  .info-card p { font-size: 16px; line-height: 1.65; color: #5a6b82; }

  .info-services { list-style: none; margin: 22px 0 0; padding: 0; }
  .info-services li { display: flex; align-items: center; gap: 12px; font-size: 15px; color: #3a4a62; margin-bottom: 12px; }
  .info-check {
    flex-shrink: 0; width: 22px; height: 22px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #7cb9ff, #4a9eff); color: white;
    box-shadow: 0 3px 8px rgba(74, 158, 255, 0.3);
  }

  .info-steps { display: flex; flex-direction: column; gap: 18px; }
  .info-step {
    display: flex; gap: 20px; align-items: flex-start;
    background: rgba(255,255,255,0.92); border: 1px solid rgba(122, 178, 255, 0.16);
    border-radius: 20px; padding: 26px 26px;
    box-shadow: 0 10px 30px rgba(45, 127, 224, 0.06);
  }
  .info-step-num {
    flex-shrink: 0; width: 46px; height: 46px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; font-weight: 800; color: white;
    background: linear-gradient(135deg, #4a9eff 0%, #2d7fe0 100%);
    box-shadow: 0 8px 22px rgba(74, 158, 255, 0.35), inset 0 1px 0 rgba(255,255,255,0.3);
  }
  .info-step h3 { font-size: 19px; font-weight: 700; margin-bottom: 6px; }
  .info-step p { font-size: 15px; line-height: 1.6; color: #5a6b82; }

  .info-cta {
    display: flex; gap: 16px; justify-content: center; align-items: center; flex-wrap: wrap;
    padding: 40px 28px 100px;
  }
  .info-cta-btn { width: auto; padding: 16px 30px; }
  .info-cta-secondary {
    display: inline-flex; align-items: center; padding: 15px 28px; border-radius: 13px;
    font-size: 16px; font-weight: 700; text-decoration: none; color: #2d7fe0;
    background: white; border: 1px solid rgba(122, 178, 255, 0.3);
    box-shadow: 0 8px 22px rgba(74, 158, 255, 0.12);
    transition: all 0.3s;
  }
  .info-cta-secondary:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(74, 158, 255, 0.2); }

  @media (max-width: 900px) {
    .info-title { font-size: 36px; }
    .info-card { padding: 28px 22px; }
  }
`;
