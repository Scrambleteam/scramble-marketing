"use client";

import Link from "next/link";
import { SCRAMBLE_THEME } from "@/lib/scramble-theme";

export default function DataDeletionPage() {
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
          <h1 className="legal-title">User Data Deletion</h1>
          <p className="legal-updated">Last updated: 23 November 2026</p>

          <div className="legal-body">
            <section>
              <h2>How to ask us to delete your data</h2>
              <p>
                You can ask Scramble Group Ltd to delete the personal data we hold about you at any
                time, including data we have received from Google, Meta (Facebook and Instagram) or
                Stripe on your behalf.
              </p>
              <p>
                Email{" "}
                <a href="mailto:helloscrambleteam@gmail.com?subject=Data%20deletion%20request">
                  helloscrambleteam@gmail.com
                </a>{" "}
                with the subject &ldquo;Data deletion request&rdquo;. Please send it from the email
                address you used to sign up, and include your company name, so we can confirm it is
                you.
              </p>
            </section>

            <section>
              <h2>What happens next</h2>
              <ul>
                <li>We confirm your request within 5 working days.</li>
                <li>
                  We stop reading data from your Google and Meta accounts and remove our access to
                  them.
                </li>
                <li>
                  We delete your account, business brief, reports and the Google and Meta data we
                  stored for you within 30 days of your request.
                </li>
                <li>We email you when the deletion is complete.</li>
              </ul>
            </section>

            <section>
              <h2>What we keep</h2>
              <p>
                We keep billing records, such as invoices and payment history, for six years to meet
                UK tax requirements. These are held by us and by Stripe, and are not used for
                anything else.
              </p>
            </section>

            <section>
              <h2>Remove our access yourself</h2>
              <p>
                You can also remove Scramble&rsquo;s access at any time without contacting us: in
                your Google account under Security &rarr; Third-party access, and in Meta Business
                Settings under Partners. Once access is removed we stop reading your data. To delete
                the data we already hold, send a request as above.
              </p>
              <p>
                More detail on how we handle your data is in our{" "}
                <Link href="/privacy-policy">Privacy Policy</Link>.
              </p>
            </section>
          </div>
        </div>
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
