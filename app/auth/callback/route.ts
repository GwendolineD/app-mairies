import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  RECOVERY_COOKIE_MAX_AGE,
  RECOVERY_COOKIE_NAME,
} from "@/lib/constants/auth";
import { ROUTES } from "@/lib/constants/routes";
import { getAppUrl } from "@/lib/utils/app-url";

type AuthCallbackFlow = "recovery" | "email_change" | "default";

function authCallbackErrorRedirect(appOrigin: string, flow: AuthCallbackFlow) {
  if (flow === "email_change") {
    return NextResponse.redirect(
      `${appOrigin}${ROUTES.profil}?email_change_error=1`,
    );
  }

  const errorParam =
    flow === "recovery" ? "auth_callback_recovery" : "auth_callback";
  return NextResponse.redirect(
    `${appOrigin}${ROUTES.connexion}?error=${errorParam}`,
  );
}

function resolveFlow(type: string | null): AuthCallbackFlow {
  if (type === "recovery") return "recovery";
  if (type === "email_change") return "email_change";
  return "default";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? ROUTES.accueil;
  const appOrigin = getAppUrl();
  const flow = resolveFlow(type);

  if (searchParams.get("error")) {
    return authCallbackErrorRedirect(appOrigin, flow);
  }

  if (!code && !(tokenHash && type)) {
    return authCallbackErrorRedirect(appOrigin, flow);
  }

  const isRecovery = flow === "recovery";
  const isEmailChange = flow === "email_change";
  const destination = isRecovery
    ? ROUTES.connexionNewPassword
    : isEmailChange
      ? `${ROUTES.profil}?email_changed=1`
      : next;
  let response = NextResponse.redirect(`${appOrigin}${destination}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.redirect(`${appOrigin}${destination}`);
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  let exchangeError: Error | null = null;

  // Prefer token_hash + verifyOtp for SSR email flows (email change, etc.)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    if (error) exchangeError = error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) exchangeError = error;
  }

  if (exchangeError) {
    return authCallbackErrorRedirect(appOrigin, flow);
  }

  if (isRecovery) {
    response.cookies.set(RECOVERY_COOKIE_NAME, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: RECOVERY_COOKIE_MAX_AGE,
      path: "/",
    });
  }

  return response;
}
