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

function authCallbackErrorRedirect(appOrigin: string) {
  return NextResponse.redirect(
    `${appOrigin}${ROUTES.connexion}?error=auth_callback`,
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? ROUTES.accueil;
  const appOrigin = getAppUrl();

  if (searchParams.get("error")) {
    return authCallbackErrorRedirect(appOrigin);
  }

  if (!code && !(tokenHash && type)) {
    return authCallbackErrorRedirect(appOrigin);
  }

  const isRecovery = type === "recovery";
  const destination = isRecovery ? ROUTES.connexionNewPassword : next;
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

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) exchangeError = error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    if (error) exchangeError = error;
  }

  if (exchangeError) {
    return authCallbackErrorRedirect(appOrigin);
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
