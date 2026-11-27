import type { Metadata, Viewport } from "next";

// The Scramble team mobile app: a web app Herbie and Gabriel add to their phone's home screen.
export const metadata: Metadata = {
  title: "Scramble Team",
  description: "Scramble's team to-do list, week and worker inbox",
  manifest: "/team-app.webmanifest",
  robots: { index: false, follow: false },
  icons: { icon: "/team-app/icon-192.png", apple: "/team-app/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Scramble", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#2d7fe0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function TeamAppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
