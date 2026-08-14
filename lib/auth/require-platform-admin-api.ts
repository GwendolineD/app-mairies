import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PlatformAdminApiContext = {
  userId: string;
};

type PlatformAdminApiResult =
  | { ok: true; ctx: PlatformAdminApiContext }
  | { ok: false; response: NextResponse };

export async function requirePlatformAdminApi(): Promise<PlatformAdminApiResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Non authentifié." }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: profileError.message },
        { status: 500 },
      ),
    };
  }

  if (!profile?.is_platform_admin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Accès refusé." }, { status: 403 }),
    };
  }

  return { ok: true, ctx: { userId: user.id } };
}
