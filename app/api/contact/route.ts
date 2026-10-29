import { NextRequest, after } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { apiError, apiOk } from "@/lib/api-response";
import { EnquiryInput, normaliseEnquiry, validateEnquiry } from "@/lib/enquiry";
import { sendEmail } from "@/lib/email";
import { buildEnquiryEmail } from "@/lib/enquiry-email";

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

    // Email the team after responding, so the form isn't held up by it.
    // The enquiry is already saved, so a failed email loses nothing.
    const enquiryId = data.id as string;
    after(() => notifyTeam(enquiryId, enquiry));

    return apiOk({ id: data.id, name: enquiry.name });
  } catch (err) {
    console.error("[contact]", err);
    return apiError("INTERNAL_ERROR", "We couldn't send your enquiry. Please try again.", 500);
  }
}

async function notifyTeam(enquiryId: string, enquiry: EnquiryInput) {
  const result = await sendEmail(buildEnquiryEmail(enquiry, enquiryId));
  if (result.sent) {
    console.info(`[contact] enquiry ${enquiryId} notification sent (${result.id})`);
  } else {
    console.error(`[contact] enquiry ${enquiryId} notification NOT sent: ${result.reason}`);
  }
}
