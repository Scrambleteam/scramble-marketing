import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/dashboard/Navbar";
import CookieConsent from "@/components/CookieConsent";

export const metadata: Metadata = {
  title: "Scramble Marketing Hub",
  description: "SEO & Marketing Dashboard for Scramble Marketing",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="text-text antialiased min-h-screen">
        <Navbar />
        <main>{children}</main>
        <CookieConsent />
      </body>
    </html>
  );
}
