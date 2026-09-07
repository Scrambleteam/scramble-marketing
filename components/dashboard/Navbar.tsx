"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/settings", label: "Settings" },
];

// Public/marketing routes that render their own chrome and should NOT show
// the internal dashboard navbar.
const PUBLIC_ROUTES = ["/landing", "/pricing", "/auth", "/onboarding", "/dashboard", "/admin-login", "/privacy-policy", "/cookie-policy", "/terms"];

export default function Navbar() {
  const pathname = usePathname();

  // Hide the dashboard navbar on public/marketing pages AND the admin root
  // (both render their own branded nav).
  if (
    pathname === "/" ||
    PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/") || pathname.startsWith(r))
  ) {
    return null;
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header
      style={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
        boxShadow: "0 1px 12px rgba(0, 0, 0, 0.04)",
      }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="max-w-6xl mx-auto px-6">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #6b8e7f 0%, #7fa592 100%)",
                boxShadow: "0 2px 8px rgba(8, 145, 178, 0.25)",
              }}
            >
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-base font-bold text-text tracking-tight">Scramble</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-8">
            {NAV_ITEMS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="relative text-[15px] font-medium transition-colors"
                style={{
                  color: isActive(href) ? "#6b8e7f" : "#555",
                }}
              >
                {label}
                {isActive(href) && (
                  <span
                    className="absolute -bottom-[1.19rem] left-0 right-0 h-0.5 rounded-sm"
                    style={{
                      background: "linear-gradient(90deg, #6b8e7f, #7fa592)",
                    }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{
                background: "linear-gradient(135deg, #6b8e7f 0%, #7fa592 100%)",
              }}
            >
              G
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
