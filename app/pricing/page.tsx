"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TIERS } from "@/lib/tiers";
import { SCRAMBLE_THEME } from "@/lib/scramble-theme";

export default function PricingPage() {
  const router = useRouter();

  const handleSelect = (tierKey: string) => {
    router.push(`/auth/signup?tier=${tierKey}`);
  };

  return (
    <div className="sc-root">
      <style>{SCRAMBLE_THEME}</style>
      <style>{pricingStyles}</style>

      {/* Nav */}
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

      {/* Header */}
      <section className="pricing-head">
        <div className="sc-eyebrow">Pricing</div>
        <h1 className="pricing-title">
          Choose the <span className="sc-gradient-gold">services</span> you need
        </h1>
        <p className="pricing-sub">
          Pick SEO, Ads, or the full package. Only pay for what you use — every plan
          includes automated reports and a live dashboard.
        </p>
      </section>

      {/* Tiers */}
      <section className="pricing-grid-wrap">
        <div className="pricing-grid">
          {TIERS.map((tier) => (
            <div
              key={tier.key}
              className={`pricing-card ${tier.highlight ? "highlight" : ""}`}
            >
              {tier.highlight && <div className="pricing-badge">Most popular</div>}
              <div className={`pricing-accent accent-${tier.accent}`} />

              <h3 className="pricing-name">{tier.name}</h3>
              <p className="pricing-tagline">{tier.tagline}</p>

              <div className="pricing-price-row">
                <span className="pricing-price">{tier.price}</span>
                <span className="pricing-price-note">{tier.priceNote}</span>
              </div>

              <ul className="pricing-features">
                {tier.features.map((f, i) => (
                  <li key={i}>
                    <span className="pricing-check">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelect(tier.key)}
                className={`pricing-cta ${tier.highlight ? "highlight" : ""}`}
              >
                Choose {tier.name}
              </button>
            </div>
          ))}
        </div>

        <p className="pricing-foot">
          7-day free trial on every plan. Cancel anytime.
        </p>
      </section>
    </div>
  );
}

const pricingStyles = `
  .sc-eyebrow {
    display: inline-block; font-size: 13px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; color: #4a9eff; margin-bottom: 14px;
  }
  .pricing-head { text-align: center; padding: 150px 28px 40px; max-width: 720px; margin: 0 auto; }
  .pricing-title { font-size: 48px; font-weight: 800; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 18px; }
  .pricing-sub { font-size: 19px; color: #5a6b82; line-height: 1.6; }

  .pricing-grid-wrap { padding: 40px 28px 100px; }
  .pricing-grid {
    max-width: 1080px; margin: 0 auto;
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 26px;
    align-items: stretch;
  }
  .pricing-card {
    position: relative; background: rgba(255,255,255,0.92);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(122, 178, 255, 0.16);
    border-radius: 24px; padding: 40px 32px 36px;
    box-shadow: 0 16px 40px rgba(45, 127, 224, 0.08), inset 0 1px 0 rgba(255,255,255,0.9);
    display: flex; flex-direction: column;
    transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
    overflow: hidden;
  }
  .pricing-card:hover { transform: translateY(-8px); box-shadow: 0 28px 60px rgba(45, 127, 224, 0.16); }
  .pricing-card.highlight {
    border: 2px solid #4a9eff;
    box-shadow: 0 24px 60px rgba(74, 158, 255, 0.25), inset 0 1px 0 rgba(255,255,255,0.9);
    transform: scale(1.03);
  }
  .pricing-card.highlight:hover { transform: scale(1.03) translateY(-8px); }

  .pricing-accent { position: absolute; top: 0; left: 0; right: 0; height: 6px; }
  .accent-blue { background: linear-gradient(90deg, #7cb9ff, #4a9eff); }
  .accent-gold { background: linear-gradient(90deg, #ffd88a, #f4b942); }
  .accent-gradient { background: linear-gradient(90deg, #4a9eff, #f4b942); }

  .pricing-badge {
    position: absolute; top: 20px; right: 20px;
    background: linear-gradient(135deg, #f4b942, #e89b1f);
    color: white; font-size: 12px; font-weight: 700;
    padding: 5px 12px; border-radius: 999px;
    box-shadow: 0 4px 12px rgba(244, 185, 66, 0.4);
  }

  .pricing-name { font-size: 26px; font-weight: 800; margin-bottom: 6px; margin-top: 8px; }
  .pricing-tagline { font-size: 15px; color: #5a6b82; margin-bottom: 24px; min-height: 44px; }
  .pricing-price-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 28px; }
  .pricing-price { font-size: 44px; font-weight: 800; letter-spacing: -1.5px; color: #16243a; }
  .pricing-price-note { font-size: 15px; color: #8a97ab; font-weight: 500; }

  .pricing-features { list-style: none; margin: 0 0 32px; padding: 0; flex: 1; }
  .pricing-features li {
    display: flex; align-items: flex-start; gap: 12px;
    font-size: 15px; color: #3a4a62; margin-bottom: 14px; line-height: 1.4;
  }
  .pricing-check {
    flex-shrink: 0; width: 22px; height: 22px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #7cb9ff, #4a9eff); color: white;
    box-shadow: 0 3px 8px rgba(74, 158, 255, 0.3);
  }

  .pricing-cta {
    width: 100%; padding: 14px; border-radius: 13px; border: none; cursor: pointer;
    font-size: 16px; font-weight: 700; font-family: inherit;
    background: rgba(74, 158, 255, 0.1); color: #2d7fe0;
    transition: all 0.3s;
  }
  .pricing-cta:hover { background: rgba(74, 158, 255, 0.18); transform: translateY(-2px); }
  .pricing-cta.highlight {
    color: white;
    background: linear-gradient(135deg, #4a9eff 0%, #2d7fe0 100%);
    box-shadow: 0 10px 26px rgba(74, 158, 255, 0.38), inset 0 1px 0 rgba(255,255,255,0.3);
  }
  .pricing-cta.highlight:hover { box-shadow: 0 16px 36px rgba(74, 158, 255, 0.48); }

  .pricing-foot { text-align: center; margin-top: 44px; color: #8a97ab; font-size: 15px; }

  @media (max-width: 900px) {
    .pricing-grid { grid-template-columns: 1fr; max-width: 420px; }
    .pricing-card.highlight { transform: scale(1); order: -1; }
    .pricing-card.highlight:hover { transform: translateY(-8px); }
    .pricing-title { font-size: 36px; }
  }
`;
