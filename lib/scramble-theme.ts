// Shared Scramble brand styles injected into public/auth/onboarding pages.
// Pastel blue + white + gold, Plus Jakarta Sans, 3D feel.

export const SCRAMBLE_THEME = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .sc-root {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 50% at 50% 0%, rgba(122, 178, 255, 0.22) 0%, transparent 60%),
      linear-gradient(180deg, #f4f9ff 0%, #eaf3ff 100%);
    color: #16243a;
  }

  /* Floating nav shared */
  .sc-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 18px 0;
    background: rgba(244, 249, 255, 0.72);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(122, 178, 255, 0.12);
  }
  .sc-nav-inner {
    max-width: 1180px; margin: 0 auto; padding: 0 28px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .sc-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
  .sc-logo-mark {
    width: 38px; height: 38px; border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #4a9eff 0%, #2d7fe0 100%);
    box-shadow: 0 6px 16px rgba(74, 158, 255, 0.35), inset 0 1px 0 rgba(255,255,255,0.4);
  }
  .sc-logo-text {
    font-size: 20px; font-weight: 800; letter-spacing: -0.5px;
    background: linear-gradient(135deg, #2d7fe0 0%, #1a5fb0 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }

  /* Buttons */
  .sc-btn-primary {
    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    color: white; font-size: 16px; font-weight: 700; text-decoration: none;
    padding: 14px 26px; border-radius: 13px; border: none; cursor: pointer; width: 100%;
    background: linear-gradient(135deg, #4a9eff 0%, #2d7fe0 100%);
    box-shadow: 0 10px 26px rgba(74, 158, 255, 0.38), inset 0 1px 0 rgba(255,255,255,0.3);
    transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
    font-family: inherit;
  }
  .sc-btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 16px 36px rgba(74, 158, 255, 0.48), inset 0 1px 0 rgba(255,255,255,0.3);
  }
  .sc-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

  .sc-btn-google {
    display: inline-flex; align-items: center; justify-content: center; gap: 12px;
    color: #16243a; font-size: 16px; font-weight: 700; text-decoration: none;
    padding: 14px 26px; border-radius: 13px; cursor: pointer; width: 100%;
    background: white; border: 1px solid rgba(122, 178, 255, 0.3);
    box-shadow: 0 8px 22px rgba(74, 158, 255, 0.12), inset 0 1px 0 rgba(255,255,255,0.9);
    transition: all 0.3s; font-family: inherit;
  }
  .sc-btn-google:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(74, 158, 255, 0.2); }
  .sc-btn-google:disabled { opacity: 0.6; cursor: not-allowed; }

  .sc-btn-meta {
    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    width: 100%; padding: 14px 24px; border-radius: 12px;
    font-size: 16px; font-weight: 600; cursor: pointer;
    background: #1877F2; color: white; border: none;
    box-shadow: 0 4px 14px rgba(24, 119, 242, 0.3);
    transition: all 0.2s; font-family: inherit;
  }
  .sc-btn-meta:hover:not(:disabled) { background: #1565C0; }
  .sc-btn-meta:disabled { opacity: 0.6; cursor: not-allowed; }

  /* Glass card */
  .sc-card {
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.9);
    border-radius: 24px;
    box-shadow: 0 30px 70px rgba(45, 127, 224, 0.14), inset 0 1px 0 rgba(255,255,255,0.9);
  }

  /* Inputs */
  .sc-label { display: block; font-size: 14px; font-weight: 600; color: #4a5a72; margin-bottom: 8px; }
  .sc-input {
    width: 100%; padding: 13px 16px; border-radius: 12px; font-size: 15px;
    background: white; border: 1px solid rgba(122, 178, 255, 0.28);
    color: #16243a; transition: all 0.2s; font-family: inherit;
    box-shadow: inset 0 1px 3px rgba(45,127,224,0.05);
  }
  .sc-input::placeholder { color: #a8b4c6; }
  .sc-input:focus {
    outline: none; border-color: #4a9eff;
    box-shadow: 0 0 0 4px rgba(74, 158, 255, 0.12);
  }

  .sc-gold { color: #e89b1f; }
  .sc-gradient-gold {
    background: linear-gradient(135deg, #f4b942 0%, #e89b1f 50%, #4a9eff 120%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .sc-link { color: #2d7fe0; font-weight: 600; text-decoration: none; }
  .sc-link:hover { text-decoration: underline; }

  .sc-error {
    background: rgba(255, 138, 128, 0.12); border: 1px solid rgba(255, 138, 128, 0.35);
    color: #c0392b; padding: 12px 16px; border-radius: 12px; font-size: 14px; font-weight: 500;
  }
  .sc-success {
    background: rgba(52, 199, 123, 0.12); border: 1px solid rgba(52, 199, 123, 0.35);
    color: #1a8a4f; padding: 12px 16px; border-radius: 12px; font-size: 14px; font-weight: 500;
  }
`
