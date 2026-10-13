// Enquiry form validation, shared by the /contact page (client) and
// POST /api/contact (server) so both sides apply the same rules.

export interface EnquiryInput {
  name: string;
  email: string;
  company: string;
  website: string;
  message: string;
  consent: boolean;
}

export type EnquiryErrors = Partial<Record<keyof EnquiryInput, string>>;

const MAX_LENGTH = {
  name: 200,
  email: 320,
  company: 200,
  website: 500,
  message: 5000,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isLikelyWebsite(value: string): boolean {
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.hostname.includes(".");
  } catch {
    return false;
  }
}

/** Coerce an unknown request body into trimmed enquiry fields. */
export function normaliseEnquiry(raw: unknown): EnquiryInput {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  return {
    name: str(body.name),
    email: str(body.email),
    company: str(body.company),
    website: str(body.website),
    message: str(body.message),
    consent: body.consent === true,
  };
}

export function validateEnquiry(input: EnquiryInput): EnquiryErrors {
  const errors: EnquiryErrors = {};

  if (!input.name) errors.name = "Please enter your name.";
  else if (input.name.length > MAX_LENGTH.name) errors.name = "Name is too long.";

  if (!input.email) errors.email = "Please enter your email address.";
  else if (input.email.length > MAX_LENGTH.email || !EMAIL_RE.test(input.email))
    errors.email = "Please enter a valid email address.";

  if (input.company.length > MAX_LENGTH.company) errors.company = "Company name is too long.";

  if (input.website) {
    if (input.website.length > MAX_LENGTH.website) errors.website = "Website is too long.";
    else if (!isLikelyWebsite(input.website)) errors.website = "Please enter a valid website address.";
  }

  if (input.message.length > MAX_LENGTH.message)
    errors.message = `Please keep your message under ${MAX_LENGTH.message} characters.`;

  if (!input.consent) errors.consent = "Please agree to the Privacy Policy to continue.";

  return errors;
}
