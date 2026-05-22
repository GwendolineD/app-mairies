import { createClient } from "@/lib/supabase/server";

export default async function PlatformAdminHomePage() {
  const supabase = await createClient();
  const { count: communeCount } = await supabase
    .from("communes")
    .select("*", { count: "exact", head: true });

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">Vue plateforme</h2>
      <p className="text-sm text-muted">
        Aperçu rapide avant d&apos;ouvrir les écrans spécialisés : communes suivies ({communeCount}{" "}
        fiches en base), commune pilote Les Authieux et extensions futures.
      </p>
    </div>
  );
}
