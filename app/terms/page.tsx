"use client";

import Link from "next/link";
import { SCRAMBLE_THEME } from "@/lib/scramble-theme";

export default function TermsOfServicePage() {
  return (
    <div className="sc-root">
      <style>{SCRAMBLE_THEME}</style>
      <style>{legalPageStyles}</style>

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
          <Link href="/landing" className="sc-link" style={{ fontSize: 15 }}>
            ← Back to home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="legal-wrap">
        <div className="legal-card">
          <div className="legal-badge">Legal</div>
          <h1 className="legal-title">Terms of Service</h1>
          <p className="legal-updated">Last updated: 25 September 2026</p>

          <div className="legal-body">
            <section>
              <h2>1. Introduction</h2>
              <p>
                These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the
                Scramble Marketing website, dashboard, and related services (the &ldquo;Service&rdquo;),
                provided by Scramble Marketing Hub (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;).
              </p>
              <p>
                By creating an account or using the Service, you agree to be bound by these Terms.
                If you do not agree, please do not use the Service.
              </p>
              <p>
                <strong>Contact Email:</strong>{" "}
                <a href="mailto:helloscrambleteam@gmail.com">helloscrambleteam@gmail.com</a>
              </p>
            </section>

            <section>
              <h2>2. The Service</h2>
              <p>
                Scramble Marketing is a done-for-you digital marketing service. We connect to your
                Google Search Console, Google Analytics, Google Ads, and (where enabled) Meta Ads
                accounts to plan, run, and optimise search engine optimisation (SEO) and paid
                advertising campaigns on your behalf, and to report on their performance through
                your dashboard.
              </p>
              <p>
                By connecting an account (Google or Meta) and granting the requested permissions,
                you authorise us to view your marketing data and, where the connected use case
                requires it, to create, edit, pause, and optimise campaigns and budgets on your
                behalf within the scope of the plan you have subscribed to. We do not sell,
                exchange, or use your advertising accounts for any purpose other than delivering
                the Service to you.
              </p>
            </section>

            <section>
              <h2>3. Accounts and Eligibility</h2>
              <p>
                You must provide accurate account information and keep your login credentials
                secure. You are responsible for all activity that occurs under your account. Our
                services are not directed at individuals under the age of 18.
              </p>
            </section>

            <section>
              <h2>4. Subscriptions, Billing &amp; Trials</h2>
              <p>The Service is offered on the following paid, subscription plans:</p>
              <ul>
                <li><strong>SEO</strong> — £400/month</li>
                <li><strong>Ads</strong> — £450/month</li>
                <li><strong>Full</strong> (SEO + Ads) — £750/month</li>
              </ul>
              <p>
                New subscriptions include a <strong>7-day free trial</strong>. Unless you cancel
                before the trial ends, your subscription will automatically convert to a paid plan
                and your payment method will be charged. Subscriptions renew automatically each
                month until cancelled.
              </p>
              <p>
                Payments are processed securely by <strong>Stripe</strong>; we do not store your
                card details ourselves. You can manage or cancel your subscription, and view
                invoices, at any time from your dashboard&rsquo;s billing portal. Cancelling stops
                future renewals; it does not automatically refund the current billing period unless
                required by law.
              </p>
            </section>

            <section>
              <h2>5. Connected Third-Party Accounts</h2>
              <p>
                Some features require connecting a Google and/or Meta account via OAuth. You can
                disconnect a connected account at any time from your dashboard settings, which
                revokes our access going forward. Disconnecting may limit or stop the corresponding
                part of the Service (for example, we cannot manage ad campaigns we no longer have
                permission to access).
              </p>
              <p>
                Your use of connected third-party platforms remains subject to those platforms&rsquo;
                own terms — including Google&rsquo;s and Meta&rsquo;s advertising policies. You remain
                responsible for the underlying ad account and any spend, billing, or compliance
                obligations you hold directly with those platforms.
              </p>
            </section>

            <section>
              <h2>6. No Guarantee of Results</h2>
              <p>
                Marketing and advertising performance depends on many factors outside our control,
                including platform algorithm changes, market competition, and your own website or
                offer. We will act with reasonable skill and care, but we do not guarantee specific
                rankings, traffic, conversions, return on ad spend, or other outcomes.
              </p>
            </section>

            <section>
              <h2>7. Acceptable Use</h2>
              <p>You agree not to use the Service to:</p>
              <ul>
                <li>Violate any applicable law or the policies of a connected platform (e.g. Google, Meta)</li>
                <li>Promote content that is illegal, fraudulent, or infringes another party&rsquo;s rights</li>
                <li>Attempt to gain unauthorised access to the Service or another user&rsquo;s account or data</li>
                <li>Interfere with or disrupt the integrity or performance of the Service</li>
              </ul>
            </section>

            <section>
              <h2>8. Intellectual Property</h2>
              <p>
                We retain all rights in the Service, including its software, design, and dashboard.
                You retain all rights in your own content, brand, and website. You grant us a
                limited licence to use your data and connected accounts solely to provide the
                Service to you.
              </p>
            </section>

            <section>
              <h2>9. Termination</h2>
              <p>
                You may stop using the Service and cancel your subscription at any time. We may
                suspend or terminate your access if you breach these Terms, misuse connected
                third-party accounts, or fail to pay applicable fees. On termination, your access to
                the dashboard ends and connected account access is revoked; data is handled as
                described in our{" "}
                <Link href="/privacy-policy">Privacy Policy</Link>.
              </p>
            </section>

            <section>
              <h2>10. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, Scramble Marketing Hub shall not be liable
                for any indirect, incidental, or consequential loss, including loss of profits,
                revenue, or advertising spend, arising from your use of the Service. Nothing in
                these Terms excludes or limits liability that cannot lawfully be excluded, such as
                for fraud or death or personal injury caused by negligence.
              </p>
            </section>

            <section>
              <h2>11. Changes to the Service or These Terms</h2>
              <p>
                We may update these Terms or change, suspend, or discontinue any part of the
                Service from time to time. Material changes will be posted on this page with an
                updated &ldquo;Last updated&rdquo; date. Continued use of the Service after changes take
                effect constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2>12. Governing Law</h2>
              <p>
                These Terms are governed by the laws of England and Wales, and any disputes will be
                subject to the exclusive jurisdiction of the courts of England and Wales.
              </p>
            </section>

            <section>
              <h2>13. Contact Us</h2>
              <p>If you have any questions about these Terms, please contact us:</p>
              <p>
                <strong>Scramble Marketing Hub</strong><br />
                Email:{" "}
                <a href="mailto:helloscrambleteam@gmail.com">helloscrambleteam@gmail.com</a>
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="legal-footer">
          <div className="legal-footer-links">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <span>·</span>
            <Link href="/cookie-policy">Cookie Policy</Link>
            <span>·</span>
            <Link href="/terms">Terms of Service</Link>
          </div>
          <p>© 2026 Scramble Marketing Hub. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

const legalPageStyles = `
  .legal-wrap {
    max-width: 800px;
    margin: 0 auto;
    padding: 130px 28px 60px;
  }

  .legal-card {
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(122, 178, 255, 0.14);
    border-radius: 24px;
    padding: 48px 44px;
    box-shadow: 0 16px 40px rgba(45, 127, 224, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  .legal-badge {
    display: inline-block;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #4a9eff;
    margin-bottom: 14px;
  }

  .legal-title {
    font-size: 40px;
    font-weight: 800;
    letter-spacing: -1.5px;
    color: #16243a;
    margin-bottom: 8px;
    line-height: 1.1;
  }

  .legal-updated {
    font-size: 15px;
    color: #8a97ab;
    margin-bottom: 40px;
    padding-bottom: 32px;
    border-bottom: 1px solid rgba(122, 178, 255, 0.15);
  }

  .legal-body section {
    margin-bottom: 36px;
  }

  .legal-body section:last-child {
    margin-bottom: 0;
  }

  .legal-body h2 {
    font-size: 22px;
    font-weight: 700;
    color: #16243a;
    margin-bottom: 14px;
    letter-spacing: -0.3px;
  }

  .legal-body h3 {
    font-size: 17px;
    font-weight: 700;
    color: #2d7fe0;
    margin-top: 20px;
    margin-bottom: 10px;
  }

  .legal-body p {
    font-size: 15px;
    line-height: 1.7;
    color: #3a4a62;
    margin-bottom: 14px;
  }

  .legal-body ul {
    list-style: none;
    padding: 0;
    margin: 0 0 16px;
  }

  .legal-body ul li {
    position: relative;
    padding-left: 24px;
    font-size: 15px;
    line-height: 1.7;
    color: #3a4a62;
    margin-bottom: 10px;
  }

  .legal-body ul li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: linear-gradient(135deg, #7cb9ff, #4a9eff);
    box-shadow: 0 2px 6px rgba(74, 158, 255, 0.3);
  }

  .legal-body a {
    color: #2d7fe0;
    text-decoration: underline;
    text-underline-offset: 2px;
    font-weight: 600;
    transition: color 0.2s;
  }

  .legal-body a:hover {
    color: #4a9eff;
  }

  .legal-body strong {
    color: #16243a;
    font-weight: 700;
  }

  .legal-footer {
    text-align: center;
    padding: 40px 0 0;
  }

  .legal-footer-links {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .legal-footer-links a {
    color: #5a6b82;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s;
  }

  .legal-footer-links a:hover {
    color: #2d7fe0;
  }

  .legal-footer-links span {
    color: #d0dae8;
  }

  .legal-footer p {
    font-size: 13px;
    color: #8a97ab;
  }

  @media (max-width: 640px) {
    .legal-card {
      padding: 32px 24px;
    }

    .legal-title {
      font-size: 30px;
    }

    .legal-body h2 {
      font-size: 19px;
    }
  }
`;
