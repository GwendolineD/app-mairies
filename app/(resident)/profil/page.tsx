import { requireActiveMembership } from "@/lib/auth/session";
import { createNeighborInvite } from "@/lib/actions/messages";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/form-field";
import { PageHeading } from "@/components/ui/page-heading";

export default async function ProfilPage() {
  const ctx = await requireActiveMembership();

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", ctx.userId)
    .single();

  const profile = data;

  const communeNames = ctx.memberships
    .map((m) => m.commune?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <PageHeading title="Profil communautaire" />

      <Card className="space-y-4 p-5">
        <div>
          <p className="text-[10px] font-semibold uppercase text-muted">Pseudo affiché</p>
          <p className="text-xl font-semibold leading-7 text-text">
            {profile?.display_name ?? "Voisin·e"}
          </p>
        </div>
        <p className="text-sm font-medium leading-5 text-muted">
          Adresse approximative :{" "}
          <span className="font-semibold text-text">
            {ctx.activeMembership?.address_label ?? "non renseignée"}
          </span>
          <br />
          Communes suivies :{" "}
          <span className="font-semibold text-text">{communeNames || "—"}</span>
          <br />
          Rôle : <span className="font-semibold text-text">{ctx.profile.role}</span>
        </p>
      </Card>

      <Card className="space-y-3 p-5">
        <h2 className="text-xl font-semibold leading-7 text-text">
          Inviter un·e voisin·e proche par e-mail
        </h2>
        <form action={createNeighborInvite} className="space-y-2">
          <Input
            type="email"
            name="email"
            required
            placeholder="amie-du-quartier@mail.fr"
          />
          <Button type="submit" className="w-full">
            Envoyer l&apos;invitation chaleureuse
          </Button>
        </form>
      </Card>

      <Card className="space-y-3 p-5">
        <h2 className="text-xl font-semibold leading-7 text-text">Une autre commune active ?</h2>
        <p className="text-sm font-medium text-muted">
          Utilisez le sélecteur de commune en haut d&apos;écran dès qu&apos;une seconde adhésion
          active est disponible ; la page d&apos;inscription permet de compléter la
          démarche si besoin.
        </p>
        <Button href={ROUTES.inscription.root} variant="secondary" className="w-full">
          Parcourir l&apos;inscription multi-commune
        </Button>
      </Card>
    </div>
  );
}
