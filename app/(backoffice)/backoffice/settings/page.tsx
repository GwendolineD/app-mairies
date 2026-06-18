import { requirePlatformAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
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

  return (
    <PageStack>
      <PageHeading
        title="Réglages plateforme"
        subtitle="Paramètres globaux de la plateforme Vie Locale."
      />

      <Card className="max-w-lg space-y-6 p-6">
        <PlatformSettingsForm
          initialSupportEmail={settings?.support_email ?? "contact@vielocale.fr"}
        />
      </Card>
    </PageStack>
  );
}
