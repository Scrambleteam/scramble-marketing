// Admin allowlist for the Scramble management dashboard.
// Only these emails can access the admin (/) view.
export const ADMIN_EMAILS = [
  "helloscrambleteam@gmail.com",
];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

// The Google account clients add as a user on their Search Console, GA4 and
// Google Ads. Only this account can be connected as the agency connection.
export const AGENCY_GOOGLE_EMAIL = "helloscrambleteam@gmail.com";
