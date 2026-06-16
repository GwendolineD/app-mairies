import { createClient } from "@/lib/supabase/server";
import { PageHeading } from "@/components/ui/page-heading";

export default async function PlatformAdminHomePage() {
  const supabase = await createClient();
  const { count: communeCount } = await supabase
    .from("communes")
    .select("*", { count: "exact", head: true });

  return (
    <div className="space-y-3">
      <PageHeading title="Vue plateforme" />
      <p className="text-base font-medium leading-6 text-muted">
        Aperçu rapide avant d&apos;ouvrir les écrans spécialisés : communes suivies ({communeCount}{" "}
        fiches en base), commune pilote Les Authieux et extensions futures.
      </p>
    </div>
  );
}
