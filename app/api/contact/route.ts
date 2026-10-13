import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { apiError, apiOk } from "@/lib/api-response";
import { normaliseEnquiry, validateEnquiry } from "@/lib/enquiry";

const NOTIFY_EMAIL = "helloscrambleteam@gmail.com";

/**
 * POST /api/contact
 * Stores an enquiry from the public /contact form and notifies the team.
 *
 * Body: { name, email, company?, website?, message?, consent: true }
 */
export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return apiError("BAD_REQUEST", "Invalid request body", 400);
  }

  const enquiry = normaliseEnquiry(raw);
  const errors = validateEnquiry(enquiry);
  if (Object.keys(errors).length > 0) {
    return apiError("BAD_REQUEST", "Please check the highlighted fields", 400, {
      details: errors,
      retryable: false,
    });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("enquiries")
      .insert([
        {
          name: enquiry.name,
          email: enquiry.email,
          company: enquiry.company || null,
          website: enquiry.website || null,
          message: enquiry.message || null,
          consent_at: new Date().toISOString(),
          source: "contact_page",
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("[contact] insert failed", error);
      return apiError("INTERNAL_ERROR", "We couldn't send your enquiry. Please try again.", 500);
    }

    await notifyTeam(data.id);

    return apiOk({ id: data.id, name: enquiry.name });
  } catch (err) {
    console.error("[contact]", err);
    return apiError("INTERNAL_ERROR", "We couldn't send your enquiry. Please try again.", 500);
  }
}

async function notifyTeam(enquiryId: string) {
  // TODO(email): no email provider is configured in this project yet.
  // Once one is chosen, send a notification to NOTIFY_EMAIL here with the
  // enquiry details, reading any API key from an environment variable.
  // Until then the enquiry is only stored in the `enquiries` table.
  console.info(`[contact] new enquiry ${enquiryId}; email notification to ${NOTIFY_EMAIL} not sent (no provider configured)`);
}
