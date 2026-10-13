import Link from "next/link";

// Nav + footer for public marketing pages built on SCRAMBLE_THEME (sc-* classes).
// Render <style>{PUBLIC_CHROME_STYLES}</style> alongside SCRAMBLE_THEME.

export function PublicNav() {
  return (
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
        <div className="pub-nav-links">
          <Link href="/info">About</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/auth/signin" className="sc-link">Sign in</Link>
        </div>
      </div>
    </nav>
  );
}

export function PublicFooter() {
  return (
    <footer className="pub-footer">
      <div className="pub-footer-inner">
        <div className="pub-footer-links">
          <Link href="/privacy-policy">Privacy Policy</Link>
          <span className="dot">·</span>
          <Link href="/cookie-policy">Cookie Policy</Link>
          <span className="dot">·</span>
          <Link href="/terms">Terms of Service</Link>
        </div>
        <p>Scramble Group Ltd.</p>
      </div>
    </footer>
  );
}

export const PUBLIC_CHROME_STYLES = `
  .pub-nav-links { display: flex; align-items: center; gap: 28px; }
  .pub-nav-links a {
    color: #4a5a72; font-size: 15px; font-weight: 600; text-decoration: none;
    transition: color 0.2s;
  }
  .pub-nav-links a:hover { color: #2d7fe0; }
  .pub-nav-links a.sc-link { color: #2d7fe0; }

  .pub-footer { padding: 40px 28px; background: #eaf3ff; border-top: 1px solid rgba(122,178,255,0.15); }
  .pub-footer-inner {
    max-width: 1120px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
  }
  .pub-footer p { font-size: 14px; color: #8a97ab; }
  .pub-footer-links { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .pub-footer-links a { color: #5a6b82; font-size: 14px; font-weight: 600; text-decoration: none; transition: color 0.2s; }
  .pub-footer-links a:hover { color: #2d7fe0; }
  .pub-footer-links .dot { color: #d0dae8; }

  @media (max-width: 640px) {
    .pub-nav-links { gap: 16px; }
    .pub-nav-links a { font-size: 14px; }
    .pub-nav-links a:first-child, .pub-nav-links a:nth-child(2) { display: none; }
  }
`;
