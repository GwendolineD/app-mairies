import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  RECOVERY_COOKIE_MAX_AGE,
  RECOVERY_COOKIE_NAME,
} from "@/lib/constants/auth";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/utils/app-url";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? ROUTES.accueil;
  const origin = getAppUrl();
  const isRecovery = type === "recovery";

  const supabase = await createClient();
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
  } else {
    return NextResponse.redirect(
      `${origin}${ROUTES.connexion}?error=auth_callback`,
    );
  }

  if (exchangeError) {
    return NextResponse.redirect(
      `${origin}${ROUTES.connexion}?error=auth_callback`,
    );
  }

  const response = NextResponse.redirect(
    isRecovery ? `${origin}${ROUTES.connexionNewPassword}` : `${origin}${next}`,
  );

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
