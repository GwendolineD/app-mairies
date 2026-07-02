import { ROUTES } from "@/lib/constants/routes";
import { sendTemplatedEmail } from "@/lib/email/render-template";
import { createServiceClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/utils/app-url";

const VERIFICATION_EMAIL_SLUG = "email-verification";
const DEFAULT_VERIFICATION_OTP_TYPE = "magiclink";

export type SendVerificationEmailResult = {
  success: boolean;
  error?: string;
};

function buildVerificationLink(
  hashedToken: string,
  otpType: string,
): string {
  const params = new URLSearchParams({
    type: otpType,
    token_hash: hashedToken,
  });
  return `${getAppUrl()}${ROUTES.authCallback}?${params.toString()}`;
}

async function generateVerificationToken(
  serviceClient: Awaited<ReturnType<typeof createServiceClient>>,
  email: string,
  password?: string,
): Promise<{ hashedToken: string; otpType: string } | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (password) {
    const signupResult = await serviceClient.auth.admin.generateLink({
      type: "signup",
      email: normalizedEmail,
      password,
      options: {
        redirectTo: `${getAppUrl()}${ROUTES.authCallback}?type=signup`,
      },
    });

    if (
      !signupResult.error &&
      signupResult.data.properties?.hashed_token
    ) {
      return {
        hashedToken: signupResult.data.properties.hashed_token,
        otpType: "signup",
      };
    }
  }

  const magiclinkResult = await serviceClient.auth.admin.generateLink({
    type: DEFAULT_VERIFICATION_OTP_TYPE,
    email: normalizedEmail,
    options: {
      redirectTo: `${getAppUrl()}${ROUTES.authCallback}?type=${DEFAULT_VERIFICATION_OTP_TYPE}`,
    },
  });

  if (
    magiclinkResult.error ||
    !magiclinkResult.data.properties?.hashed_token
  ) {
    console.error(
      "[email] generateLink verification failed:",
      magiclinkResult.error?.message,
    );
    return null;
  }

  return {
    hashedToken: magiclinkResult.data.properties.hashed_token,
    otpType: DEFAULT_VERIFICATION_OTP_TYPE,
  };
}

async function findAuthUserByEmail(email: string) {
  const serviceClient = await createServiceClient();
  const normalized = email.trim().toLowerCase();
  let page = 1;

  while (page <= 10) {
    const { data, error } = await serviceClient.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error || !data.users.length) {
      return null;
    }

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === normalized,
    );
    if (user) {
      return user;
    }

    if (data.users.length < 200) {
      break;
    }

    page += 1;
  }

  return null;
}

export async function sendVerificationEmail({
  email,
  userName,
  password,
}: {
  email: string;
  userName: string;
  password?: string;
}): Promise<SendVerificationEmailResult> {
  const serviceClient = await createServiceClient();
  const token = await generateVerificationToken(
    serviceClient,
    email,
    password,
  );

  if (!token) {
    return {
      success: false,
      error: "Impossible de générer le lien de vérification.",
    };
  }

  return sendTemplatedEmail(email, VERIFICATION_EMAIL_SLUG, {
    user_name: userName,
    verification_link: buildVerificationLink(
      token.hashedToken,
      token.otpType,
    ),
  });
}

export async function resendVerificationEmailIfNeeded(
  email: string,
): Promise<SendVerificationEmailResult> {
  const user = await findAuthUserByEmail(email);

  if (!user || user.email_confirmed_at) {
    return { success: true };
  }

  const userName =
    (typeof user.user_metadata?.first_name === "string"
      ? user.user_metadata.first_name
      : null) ??
    user.email?.split("@")[0] ??
    "Bonjour";

  return sendVerificationEmail({ email, userName });
}
