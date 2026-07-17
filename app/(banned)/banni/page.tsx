import { redirect } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { getPlatformSupportEmail } from "@/lib/actions/platform-settings";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";

export default async function BanniPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.connexion);

  // Check the ban directly: getSessionContext returns null for banned users.
  const { data: profile } = await supabase
    .from("profiles")
    .select("banned_at, ban_reason")
    .eq("user_id", user.id)
    .single();

  if (!profile?.banned_at) redirect(ROUTES.accueil);

  const supportEmail = await getPlatformSupportEmail();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-12">
      <PageHeading
        centered
        title="Votre compte a été banni"
        subtitle="Votre accès à la plateforme a été définitivement suspendu par notre équipe."
      />
      <Card className="space-y-3 p-6">
        {profile.ban_reason ? (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-subtle">
              Motif
            </p>
            <p className="text-base font-medium leading-6 text-text">
              {profile.ban_reason}
            </p>
          </div>
        ) : null}
        <p className="text-base font-medium leading-6 text-muted">
          Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, vous pouvez
          contacter notre assistance à{" "}
          <a
            href={`mailto:${supportEmail}`}
            className="font-semibold text-purple hover:underline"
          >
            {supportEmail}
          </a>
          . Pensez à préciser votre prénom, votre nom et votre e-mail de
          connexion.
        </p>
      </Card>
      <div className="flex justify-center">
        <form action={signOut}>
          <Button variant="secondary" type="submit">
            Retour à l&apos;accueil
          </Button>
        </form>
      </div>
    </div>
  );
}
