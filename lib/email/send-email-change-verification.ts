import { ROUTES } from "@/lib/constants/routes";
import { sendTemplatedEmail } from "@/lib/email/render-template";
import { createServiceClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/utils/app-url";

const EMAIL_CHANGE_VERIFICATION_SLUG = "email-change-verification";
// verifyOtp type consumed by app/auth/callback/route.ts for the email change flow.
const EMAIL_CHANGE_OTP_TYPE = "email_change";

export type SendEmailChangeVerificationResult = {
  success: boolean;
  error?: string;
};

// GoTrue stores the email_change token hashed with the target email, so the
// hashed_token returned by generateLink does NOT match what verifyOtp expects.
// We instead pass the raw email OTP + the new email and verify via
// verifyOtp({ type, token, email }) in the callback.
function buildVerificationLink(otp: string, newEmail: string): string {
  const params = new URLSearchParams({
    type: EMAIL_CHANGE_OTP_TYPE,
    token: otp,
    email: newEmail,
  });
  return `${getAppUrl()}${ROUTES.authCallback}?${params.toString()}`;
}

// Uses admin.generateLink instead of auth.updateUser so the confirmation email
// is sent with our own editable template (email_templates) rather than the
// native Supabase Auth template. The generated token stages the pending change
// on auth.users and is validated by verifyOtp({ type: 'email_change' }).
export async function sendEmailChangeVerification({
  email,
  newEmail,
  userName,
}: {
  email: string;
  newEmail: string;
  userName: string;
}): Promise<SendEmailChangeVerificationResult> {
  const serviceClient = await createServiceClient();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedNewEmail = newEmail.trim().toLowerCase();

  const { data, error } = await serviceClient.auth.admin.generateLink({
    type: "email_change_new",
    email: normalizedEmail,
    newEmail: normalizedNewEmail,
    options: {
      redirectTo: `${getAppUrl()}${ROUTES.authCallback}?type=${EMAIL_CHANGE_OTP_TYPE}`,
    },
  });

  if (error || !data.properties?.email_otp) {
    console.error(
      "[email] generateLink email_change_new failed:",
      error?.message,
    );
    return {
      success: false,
      error: "Impossible de générer le lien de confirmation.",
    };
  }

  return sendTemplatedEmail(normalizedNewEmail, EMAIL_CHANGE_VERIFICATION_SLUG, {
    user_name: userName,
    new_email: normalizedNewEmail,
    verification_link: buildVerificationLink(
      data.properties.email_otp,
      normalizedNewEmail,
    ),
  });
}
