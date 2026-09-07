"use client";

import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("scramble-cookie-consent");
    if (!consent) {
      // Small delay before showing for smoother UX
      const timer = setTimeout(() => {
        setVisible(true);
        // Trigger slide-up animation after mount
        requestAnimationFrame(() => setAnimateIn(true));
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("scramble-cookie-consent", "accepted");
    setAnimateIn(false);
    setTimeout(() => setVisible(false), 300);
  };

  const handleReject = () => {
    localStorage.setItem("scramble-cookie-consent", "rejected");
    setAnimateIn(false);
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  return (
    <>
      <style>{cookieConsentStyles}</style>
      <div className={`cookie-banner ${animateIn ? "cookie-banner-visible" : ""}`}>
        <div className="cookie-banner-inner">
          <div className="cookie-banner-content">
            <div className="cookie-banner-icon">🍪</div>
            <div className="cookie-banner-text">
              <p className="cookie-banner-title">We value your privacy</p>
              <p className="cookie-banner-desc">
                We use essential cookies to make our site work. We'd also like to set optional
                cookies to help us improve your experience.{" "}
                <a href="/cookie-policy" className="cookie-banner-link">Learn more</a>
              </p>
            </div>
          </div>
          <div className="cookie-banner-actions">
            <button onClick={handleReject} className="cookie-btn-reject">
              Reject Non-Essential
            </button>
            <button onClick={handleAccept} className="cookie-btn-accept">
              Accept All
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const cookieConsentStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .cookie-banner {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    padding: 16px 20px;
    transform: translateY(100%);
    opacity: 0;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .cookie-banner-visible {
    transform: translateY(0);
    opacity: 1;
  }

  .cookie-banner-inner {
    max-width: 1080px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 20px 28px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(122, 178, 255, 0.2);
    box-shadow:
      0 -4px 30px rgba(45, 127, 224, 0.1),
      0 8px 32px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  .cookie-banner-content {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    flex: 1;
  }

  .cookie-banner-icon {
    font-size: 28px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .cookie-banner-text {
    flex: 1;
  }

  .cookie-banner-title {
    font-size: 16px;
    font-weight: 700;
    color: #16243a;
    margin-bottom: 4px;
  }

  .cookie-banner-desc {
    font-size: 14px;
    line-height: 1.5;
    color: #5a6b82;
  }

  .cookie-banner-link {
    color: #2d7fe0;
    text-decoration: underline;
    text-underline-offset: 2px;
    font-weight: 600;
    transition: color 0.2s;
  }

  .cookie-banner-link:hover {
    color: #4a9eff;
  }

  .cookie-banner-actions {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
  }

  .cookie-btn-reject {
    padding: 10px 20px;
    border-radius: 12px;
    border: 1px solid rgba(122, 178, 255, 0.3);
    background: rgba(255, 255, 255, 0.8);
    color: #4a5a72;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cookie-btn-reject:hover {
    background: white;
    border-color: rgba(122, 178, 255, 0.5);
    color: #2d7fe0;
  }

  .cookie-btn-accept {
    padding: 10px 20px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #4a9eff 0%, #2d7fe0 100%);
    color: white;
    font-size: 14px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    box-shadow: 0 6px 16px rgba(74, 158, 255, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .cookie-btn-accept:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 22px rgba(74, 158, 255, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  @media (max-width: 700px) {
    .cookie-banner-inner {
      flex-direction: column;
      padding: 20px;
    }

    .cookie-banner-actions {
      width: 100%;
    }

    .cookie-btn-reject,
    .cookie-btn-accept {
      flex: 1;
    }
  }
`;
