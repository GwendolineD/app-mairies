import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  try {
    const { error } = await supabase.auth.getUser();
    if (error && isStaleAuthError(error)) {
      await clearStaleSession(supabase);
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

  return supabaseResponse;
}
