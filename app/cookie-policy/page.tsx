"use client";

import Link from "next/link";
import { SCRAMBLE_THEME } from "@/lib/scramble-theme";

export default function CookiePolicyPage() {
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
          <h1 className="legal-title">Cookie Policy</h1>
          <p className="legal-updated">Last updated: 7 September 2026</p>

          <div className="legal-body">
            <section>
              <h2>1. What Are Cookies?</h2>
              <p>
                Cookies are small text files that are stored on your device when you visit a
                website. They are widely used to make websites work more efficiently and to provide
                information to website owners. We also use <strong>localStorage</strong>, a similar
                browser storage mechanism, for certain preferences.
              </p>
            </section>

            <section>
              <h2>2. Cookies We Use</h2>

              <h3>2.1 Essential Cookies</h3>
              <p>
                These cookies are strictly necessary for the website to function. They cannot be
                switched off. They are set in response to actions you take, such as logging in or
                filling in forms.
              </p>
              <ul>
                <li>
                  <strong>Supabase Auth Session</strong> — stores your authenticated session token
                  so you remain logged in across pages. This is set when you sign in and expires
                  when you log out or after the session timeout period.
                </li>
                <li>
                  <strong>Cookie Consent Preference</strong> (localStorage:{" "}
                  <code>scramble-cookie-consent</code>) — remembers whether you have accepted or
                  rejected non-essential cookies so we do not ask you again on every visit.
                </li>
              </ul>

              <h3>2.2 Non-Essential Cookies</h3>
              <p>
                We currently do not set any third-party tracking, advertising, or analytics cookies.
                If we introduce non-essential cookies in the future, we will update this policy and
                request your consent before setting them.
              </p>
            </section>

            <section>
              <h2>3. How to Manage Cookies</h2>
              <p>
                You can control and delete cookies through your browser settings. Here&rsquo;s how
                to manage cookies in the most popular browsers:
              </p>

              <h3>Google Chrome</h3>
              <ul>
                <li>Click the three-dot menu → Settings → Privacy and security → Cookies and other site data</li>
                <li>Choose to block or clear cookies, or manage them on a per-site basis</li>
              </ul>

              <h3>Mozilla Firefox</h3>
              <ul>
                <li>Click the menu button → Settings → Privacy &amp; Security</li>
                <li>Under &ldquo;Cookies and Site Data&rdquo;, click &ldquo;Manage Data&rdquo; to view or remove cookies</li>
              </ul>

              <h3>Safari</h3>
              <ul>
                <li>Go to Safari → Preferences → Privacy</li>
                <li>Click &ldquo;Manage Website Data&rdquo; to view or remove cookies</li>
              </ul>

              <h3>Microsoft Edge</h3>
              <ul>
                <li>Click the three-dot menu → Settings → Cookies and site permissions → Manage and delete cookies and site data</li>
                <li>Toggle settings or clear existing cookies as needed</li>
              </ul>

              <p>
                <strong>Note:</strong> Blocking essential cookies may affect the functionality of
                our website, including the ability to log in and use the dashboard.
              </p>
            </section>

            <section>
              <h2>4. localStorage Data</h2>
              <p>
                In addition to cookies, we use your browser&rsquo;s localStorage to save your
                cookie consent preference. localStorage data does not expire automatically but can
                be cleared through your browser&rsquo;s developer tools or settings:
              </p>
              <ul>
                <li>Open your browser&rsquo;s Developer Tools (F12 or Ctrl+Shift+I / Cmd+Option+I)</li>
                <li>Go to the Application tab → Local Storage</li>
                <li>Select our domain and delete the <code>scramble-cookie-consent</code> entry to reset your consent preference</li>
              </ul>
            </section>

            <section>
              <h2>5. Changes to This Policy</h2>
              <p>
                We may update this Cookie Policy from time to time. Any changes will be posted on
                this page with an updated &ldquo;Last updated&rdquo; date. If we begin using new types of
                cookies, we will notify you and obtain consent where required.
              </p>
            </section>

            <section>
              <h2>6. Contact Us</h2>
              <p>
                If you have questions about our use of cookies, please contact us:
              </p>
              <p>
                <strong>Scramble Marketing Hub</strong><br />
                Email:{" "}
                <a href="mailto:helloscrambleteam@gmail.com">helloscrambleteam@gmail.com</a>
              </p>
              <p>
                For full details about how we handle your personal data, please read our{" "}
                <Link href="/privacy-policy">Privacy Policy</Link>.
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

  .legal-body code {
    background: rgba(74, 158, 255, 0.08);
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 13px;
    font-family: 'SF Mono', 'Fira Code', monospace;
    color: #2d7fe0;
    border: 1px solid rgba(74, 158, 255, 0.12);
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
