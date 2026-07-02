import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { isCloudinaryDeliveryUrl } from "@/lib/services/cloudinary";

export const PLATFORM_SETTINGS_CACHE_TAG = "platform-settings";

function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

function parseErrorIllustrationUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry): entry is string =>
      typeof entry === "string" && isCloudinaryDeliveryUrl(entry),
  );
}

export const getErrorIllustrationUrls = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("platform_settings")
      .select("error_illustration_urls")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error("[getErrorIllustrationUrls] DB error:", error);
      return [];
    }

    return parseErrorIllustrationUrls(data?.error_illustration_urls);
  },
  ["platform-settings-error-illustrations"],
  { tags: [PLATFORM_SETTINGS_CACHE_TAG], revalidate: 3600 },
);
