import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isGuestOnlyAuthPath } from "@/lib/constants/auth";
import { ROUTES } from "@/lib/constants/routes";

function isStaleAuthError(error: { code?: string; message?: string }) {
  return (
    error.code === "refresh_token_not_found" ||
    error.code === "invalid_refresh_token" ||
    error.message?.includes("Refresh Token Not Found") ||
    error.message?.includes("Invalid Refresh Token")
  );
}

/** Clears invalid Supabase auth cookies so anonymous browsing works again. */
async function clearStaleSession(
  supabase: ReturnType<typeof createServerClient>,
) {
  try {
    await supabase.auth.signOut();
  } catch {
    // Best effort — response cookies may still be cleared by signOut's setAll
  }
}

function withSupabaseCookies(
  target: NextResponse,
  source: NextResponse,
): NextResponse {
  source.cookies.getAll().forEach(({ name, value }) => {
    target.cookies.set(name, value);
  });
  return target;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  let user: { id: string } | null = null;

  try {
    const { data, error } = await supabase.auth.getUser();
    user = data.user;
    if (error && isStaleAuthError(error)) {
      await clearStaleSession(supabase);
      user = null;
    }
  } catch (error) {
    // Stale cookies (old project, DB reset, expired session) — do not spam logs
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      isStaleAuthError(error as { code?: string; message?: string })
    ) {
      await clearStaleSession(supabase);
    }
  }

  if (user && isGuestOnlyAuthPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.accueil;
    return withSupabaseCookies(NextResponse.redirect(url), supabaseResponse);
  }

  return supabaseResponse;
}
