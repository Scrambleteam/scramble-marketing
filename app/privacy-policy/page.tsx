"use client";

import Link from "next/link";
import { SCRAMBLE_THEME } from "@/lib/scramble-theme";

export default function PrivacyPolicyPage() {
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
          <h1 className="legal-title">Privacy Policy</h1>
          <p className="legal-updated">Last updated: 7 September 2026</p>

          <div className="legal-body">
            <section>
              <h2>1. Introduction</h2>
              <p>
                Scramble Marketing (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), operated by Scramble Marketing Hub, is
                committed to protecting your personal data in accordance with the UK General Data
                Protection Regulation (UK GDPR) and the Data Protection Act 2018.
              </p>
              <p>
                This Privacy Policy explains how we collect, use, store, and share your personal
                information when you use our website, dashboard, and marketing services.
              </p>
              <p>
                <strong>Data Controller:</strong> Scramble Marketing Hub<br />
                <strong>Contact Email:</strong>{" "}
                <a href="mailto:helloscrambleteam@gmail.com">helloscrambleteam@gmail.com</a>
              </p>
            </section>

            <section>
              <h2>2. What Data We Collect</h2>
              <p>We collect the following categories of personal data:</p>

              <h3>2.1 Account Information</h3>
              <ul>
                <li><strong>Name</strong> — to personalise your account and communications</li>
                <li><strong>Email address</strong> — for authentication, notifications, and reports</li>
                <li><strong>Company name</strong> — to identify your organisation within the dashboard</li>
                <li><strong>Website URL</strong> — to connect and pull marketing data for your properties</li>
              </ul>

              <h3>2.2 Authentication Data</h3>
              <ul>
                <li>
                  <strong>Google OAuth tokens</strong> — encrypted access and refresh tokens used to
                  securely connect your Google Search Console, Google Analytics, and Google Ads
                  accounts on your behalf
                </li>
                <li>
                  <strong>Session tokens</strong> — to maintain your authenticated session
                </li>
              </ul>

              <h3>2.3 Analytics & Marketing Data</h3>
              <ul>
                <li>
                  <strong>Search Console data</strong> — keyword rankings, impressions, clicks, and
                  average positions for your connected properties
                </li>
                <li>
                  <strong>Google Analytics data</strong> — traffic, sessions, conversions, and
                  audience metrics
                </li>
                <li>
                  <strong>Google Ads data</strong> — campaign performance, spend, and conversion
                  data
                </li>
              </ul>

              <h3>2.4 Technical Data</h3>
              <ul>
                <li>IP address, browser type, device information</li>
                <li>Pages visited and interactions with our platform</li>
                <li>Cookies and local storage data (see our{" "}
                  <Link href="/cookie-policy">Cookie Policy</Link>)
                </li>
              </ul>
            </section>

            <section>
              <h2>3. Why We Collect Your Data (Legal Basis)</h2>
              <p>We process your personal data on the following lawful bases:</p>
              <ul>
                <li>
                  <strong>Contract performance</strong> — to provide the marketing dashboard and
                  reporting services you have signed up for
                </li>
                <li>
                  <strong>Legitimate interests</strong> — to improve our services, prevent fraud,
                  and ensure platform security
                </li>
                <li>
                  <strong>Consent</strong> — for optional analytics cookies and marketing
                  communications (you can withdraw consent at any time)
                </li>
                <li>
                  <strong>Legal obligation</strong> — to comply with applicable laws and regulations
                </li>
              </ul>
            </section>

            <section>
              <h2>4. How We Store and Protect Your Data</h2>
              <p>
                Your data is stored securely using <strong>Supabase</strong> (hosted on AWS
                infrastructure) with the following protections:
              </p>
              <ul>
                <li>
                  <strong>Encryption at rest</strong> — all database records, including Google OAuth
                  tokens, are encrypted using AES-256 encryption
                </li>
                <li>
                  <strong>Encryption in transit</strong> — all data transfers use TLS 1.2 or higher
                </li>
                <li>
                  <strong>Access controls</strong> — row-level security policies restrict data
                  access to authorised users only
                </li>
                <li>
                  <strong>Regular backups</strong> — automated database backups to prevent data loss
                </li>
              </ul>
            </section>

            <section>
              <h2>5. Data Retention</h2>
              <p>We retain your data for the following periods:</p>
              <ul>
                <li>
                  <strong>Account data</strong> — retained for the duration of your active account
                  plus 30 days after account deletion
                </li>
                <li>
                  <strong>Google OAuth tokens</strong> — retained while your Google account is
                  connected; deleted immediately upon disconnection
                </li>
                <li>
                  <strong>Marketing analytics data</strong> — retained for up to 24 months to
                  enable historical reporting and trend analysis
                </li>
                <li>
                  <strong>Technical logs</strong> — retained for up to 90 days for security and
                  troubleshooting purposes
                </li>
              </ul>
              <p>
                When data is no longer needed, it is securely deleted or anonymised.
              </p>
            </section>

            <section>
              <h2>6. Third-Party Services</h2>
              <p>
                We share your data with the following trusted third-party service providers, all of
                which process data in accordance with GDPR requirements:
              </p>
              <ul>
                <li>
                  <strong>Google APIs</strong> (Search Console, Analytics, Ads) — to retrieve your
                  marketing performance data via OAuth. Google&rsquo;s privacy policy:{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    policies.google.com/privacy
                  </a>
                </li>
                <li>
                  <strong>Supabase</strong> — database hosting, authentication, and storage.
                  Supabase privacy policy:{" "}
                  <a
                    href="https://supabase.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    supabase.com/privacy
                  </a>
                </li>
                <li>
                  <strong>Vercel</strong> — website hosting and deployment. Vercel privacy policy:{" "}
                  <a
                    href="https://vercel.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    vercel.com/legal/privacy-policy
                  </a>
                </li>
              </ul>
              <p>
                We do not sell your personal data to any third parties.
              </p>
            </section>

            <section>
              <h2>7. Your Rights Under UK GDPR</h2>
              <p>You have the following rights regarding your personal data:</p>
              <ul>
                <li>
                  <strong>Right of access</strong> — request a copy of all personal data we hold
                  about you
                </li>
                <li>
                  <strong>Right to rectification</strong> — request correction of inaccurate or
                  incomplete data
                </li>
                <li>
                  <strong>Right to erasure (&ldquo;right to be forgotten&rdquo;)</strong> — request
                  deletion of your personal data
                </li>
                <li>
                  <strong>Right to restrict processing</strong> — request that we limit how we use
                  your data
                </li>
                <li>
                  <strong>Right to data portability</strong> — receive your data in a structured,
                  commonly used, machine-readable format
                </li>
                <li>
                  <strong>Right to object</strong> — object to processing based on legitimate
                  interests or for direct marketing
                </li>
                <li>
                  <strong>Right to withdraw consent</strong> — withdraw any consent you have given
                  at any time
                </li>
              </ul>
            </section>

            <section>
              <h2>8. How to Exercise Your Rights</h2>
              <p>
                To exercise any of your rights, please contact us at:{" "}
                <a href="mailto:helloscrambleteam@gmail.com">helloscrambleteam@gmail.com</a>
              </p>
              <p>
                We will respond to your request within <strong>one calendar month</strong>. In
                certain circumstances, we may extend this period by a further two months, in which
                case we will inform you and explain the reason for the delay.
              </p>
              <p>
                If you are unsatisfied with our response, you have the right to lodge a complaint
                with the{" "}
                <a
                  href="https://ico.org.uk/make-a-complaint/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Information Commissioner&rsquo;s Office (ICO)
                </a>
                , the UK&rsquo;s supervisory authority for data protection.
              </p>
            </section>

            <section>
              <h2>9. Cookies</h2>
              <p>
                We use cookies and similar technologies on our website. For full details on what
                cookies we use, why, and how to manage them, please see our{" "}
                <Link href="/cookie-policy">Cookie Policy</Link>.
              </p>
            </section>

            <section>
              <h2>10. International Data Transfers</h2>
              <p>
                Some of our third-party service providers may process data outside the UK. Where
                this occurs, we ensure appropriate safeguards are in place, including Standard
                Contractual Clauses (SCCs) approved by the ICO, or the service provider is
                established in a country with an adequacy decision.
              </p>
            </section>

            <section>
              <h2>11. Children&rsquo;s Privacy</h2>
              <p>
                Our services are not directed at individuals under the age of 18. We do not
                knowingly collect personal data from children. If you believe a child has provided
                us with personal data, please contact us and we will delete it promptly.
              </p>
            </section>

            <section>
              <h2>12. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Any changes will be posted on
                this page with an updated &ldquo;Last updated&rdquo; date. We encourage you to review this
                page periodically.
              </p>
            </section>

            <section>
              <h2>13. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please
                contact us:
              </p>
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
