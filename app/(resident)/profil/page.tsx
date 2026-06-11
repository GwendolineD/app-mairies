import { requireActiveMembership } from "@/lib/auth/session";
import { createNeighborInvite } from "@/lib/actions/messages";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/form-field";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { ProfilClient } from "@/components/features/profil-client";

export default async function ProfilPage() {
  const ctx = await requireActiveMembership();
  const membership = ctx.activeMembership!;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", ctx.userId)
    .single();

  const [annCount, initCount, partCount] = await Promise.all([
    supabase
      .from("announcements")
      .select("id", { count: "exact", head: true })
      .eq("author_membership_id", membership.id),
    supabase
      .from("initiatives")
      .select("id", { count: "exact", head: true })
      .eq("author_membership_id", membership.id),
    supabase
      .from("initiative_responses")
      .select("id", { count: "exact", head: true })
      .eq("membership_id", membership.id),
  ]);

  const communeNames = ctx.memberships
    .map((m) => m.commune?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <PageStack gap="5">
      <PageHeading title="Mon profil" />

      <Card className="space-y-2 p-5">
        <p className="text-sm text-muted">
          {membership.address_street ?? membership.address_city ?? "Adresse non renseignée"} · {communeNames}
        </p>
        <p className="text-xs text-subtle">
          Rôle : {ctx.profile.is_platform_admin
            ? "Super admin"
            : membership.role === "mayor"
              ? "Maire"
              : membership.role === "staff"
                ? "Staff mairie"
                : "Résident·e"}
        </p>
      </Card>

      <ProfilClient
        displayName={profile?.display_name ?? "Voisin·e"}
        bio={profile?.bio ?? ""}
        avatarUrl={profile?.avatar_url ?? ""}
        stats={{
          announcements: annCount.count ?? 0,
          initiatives: initCount.count ?? 0,
          participations: partCount.count ?? 0,
        }}
      />

      <Card className="space-y-3 p-5">
        <h2 className="text-xl font-semibold text-text">
          Inviter un·e voisin·e proche par e-mail
        </h2>
        <form action={createNeighborInvite} className="space-y-2">
          <Input type="email" name="email" required placeholder="voisin@mail.fr" />
          <Button type="submit" className="w-full">
            Envoyer l&apos;invitation
          </Button>
        </form>
      </Card>

      <Card className="space-y-3 p-5">
        <Button href={ROUTES.inscription.root} variant="secondary" className="w-full">
          Ajouter une commune
        </Button>
      </Card>
    </PageStack>
  );
}
