import { requireCommuneStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";

export default async function MairieHabitantsPage() {
  const { communeId } = await requireCommuneStaff();

  const supabase = await createClient();

  const { data } = await supabase
    .from("memberships")
    .select("*")
    .eq("commune_id", communeId)
    .order("created_at", { ascending: false });

  return (
    <PageStack>
      <PageHeading
        title="Habitant·es suivis localement"
        subtitle="Les profils nominatifs sont visibles depuis les politiques RLS — cet écran liste l'essentiel : statuts d'adhésion et adresses approximatives."
      />

      <div className="space-y-2">
        {(data ?? []).length === 0 ? (
          <p className="text-sm font-medium text-muted">Aucune adhésion pour l&apos;instant.</p>
        ) : (
          (data ?? []).map((m) => (
            <Card key={m.id} className="flex flex-wrap justify-between gap-2 p-4 text-sm">
              <div className="space-y-1">
                <p className="font-semibold text-text">Adresse : {m.address_street ?? m.address_city}</p>
                <p className="text-[10px] font-medium text-muted">Postal : {m.address_postcode}</p>
              </div>
              <CategoryTag label={m.status} className="self-start bg-soft-pink" />
            </Card>
          ))
        )}
      </div>
    </PageStack>
  );
}
