import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function MairieHabitantsPage() {
  const ctx = await requireRole(["municipality_staff"]);
  const communeId = ctx.profile.active_commune_id;
  if (!communeId)
    return <p className="text-muted">Associez d&apos;abord une commune.</p>;

  const supabase = await createClient();

  const { data } = await supabase
    .from("memberships")
    .select("*")
    .eq("commune_id", communeId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="text-lg font-bold">Habitant·es suivis localement</h2>
        <p className="text-xs text-muted">
          Les profils nominatifs sont visibles depuis les politiques RLS — cet écran liste
          l&apos;essentiel : statuts d&apos;adhésion et adresses approximatives.
        </p>
      </Card>
      <div className="space-y-2">
        {(data ?? []).length === 0 ? (
          <p className="text-sm text-muted">Aucune adhésion pour l&apos;instant.</p>
        ) : (
          (data ?? []).map((m) => (
            <Card key={m.id} className="flex flex-wrap justify-between gap-2 p-4 text-sm">
              <div className="space-y-1">
                <p className="font-semibold text-text">Adresse : {m.address_label}</p>
                <p className="text-[10px] text-muted">Postal : {m.address_postcode}</p>
              </div>
              <span className="self-start rounded-full bg-warm px-3 py-1 text-xs font-bold">
                {m.status}
              </span>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
