import { ServiceKey } from "./tiers";

// How a client gives the agency Google account access, per service.
// Shown during onboarding and copied from the admin client workspace.
export const GOOGLE_ACCESS_STEPS: Partial<Record<ServiceKey, { title: string; steps: string }>> = {
  search_console: {
    title: "Search Console",
    steps: "Settings → Users and permissions → Add user. Paste our email and choose “Full”.",
  },
  analytics: {
    title: "Google Analytics (GA4)",
    steps: "Admin → Property access management → + → Add users. Paste our email and choose “Viewer”.",
  },
  ads: {
    title: "Google Ads",
    steps: "Admin → Access and security → + → paste our email and choose “Standard”. If we've sent you a link request from our manager account, you can accept that instead.",
  },
};
