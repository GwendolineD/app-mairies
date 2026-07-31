import { APP_NAME } from "@/lib/constants/app";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { PlatformSettingsForm } from "./_components/platform-settings-form";

export default async function BackofficeSettingsPage() {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("id", 1)
    .single();

  const initialErrorIllustrationUrls = Array.isArray(
    settings?.error_illustration_urls,
  )
    ? settings.error_illustration_urls.filter(
        (entry): entry is string => typeof entry === "string",
      )
    : [];

  const initialNotFoundIllustrationUrl =
    typeof settings?.not_found_illustration_url === "string"
      ? settings.not_found_illustration_url
      : "";

  return (
    <PageStack>
      <PageHeading
        title="Réglages plateforme"
        subtitle={`Paramètres globaux de la plateforme ${APP_NAME}.`}
      />

      <PlatformSettingsForm
        initialSupportEmail={settings?.support_email ?? "contact@tous-voisins.fr"}
        initialErrorIllustrationUrls={initialErrorIllustrationUrls}
        initialNotFoundIllustrationUrl={initialNotFoundIllustrationUrl}
      />
    </PageStack>
  );
}
