import Link from "next/link";
import { requireActiveMembership } from "@/lib/auth/session";
import { createNeighborInvite } from "@/lib/actions/messages";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
      <h1 className="text-xl font-bold text-text">Profil communautaire</h1>

      <Card className="space-y-4 p-5">
        <div>
          <p className="text-[10px] font-semibold uppercase text-muted">Pseudo affiché</p>
          <p className="text-lg font-bold text-text">{profile?.display_name ?? "Voisin·e"}</p>
        </div>
        <p className="text-xs leading-relaxed text-muted">
          Adresse approximative&nbsp;:{" "}
          <span className="font-semibold text-text">
            {ctx.activeMembership?.address_label ?? "non renseignée"}
          </span>
          <br />
          Communes suivies&nbsp;:{" "}
          <span className="font-semibold text-text">{communeNames || "—"}</span>
          <br />
          Rôle&nbsp;: <span className="font-semibold text-text">{ctx.profile.role}</span>
        </p>
      </Card>

      <Card className="space-y-3 p-5">
        <h2 className="text-base font-semibold text-text">
          Inviter un·e voisin·e proche par e-mail
        </h2>
        <form action={createNeighborInvite} className="space-y-2">
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-xl border border-border px-4 py-3 text-sm"
            placeholder="amie-du-quartier@mail.fr"
          />
          <Button type="submit" className="w-full rounded-full">
            Envoyer l&apos;invitation chaleureuse
          </Button>
        </form>
      </Card>

      <Card className="space-y-2 p-5">
        <h2 className="text-base font-semibold text-text">Une autre commune active ?</h2>
        <p className="text-xs text-muted">
          Utilisez le sélecteur de commune en haut d&apos;écran dès qu&apos;une seconde adhésion
          active est disponible&nbsp;; la page d&apos;inscription permet de compléter la
          démarche si besoin.
        </p>
        <Link
          href="/inscription"
          className="inline-flex w-full justify-center rounded-full border border-purple/40 px-4 py-2 text-sm font-semibold text-purple"
        >
          Parcourir l&apos;inscription multi-commune
        </Link>
      </Card>
    </div>
  );
}
