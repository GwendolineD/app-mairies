import { AlertTriangle, Mail, UserCheck } from "lucide-react";
import { getSessionContext } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import { ROLE_LABELS } from "@/lib/constants/roles";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InvitationAddressForm } from "@/components/features/auth/invitation-address-form";
import { SignOutButton } from "@/components/features/auth/sign-out-button";
import type { MembershipRole } from "@/lib/types";

type Props = {
  token: string;
};

type InviteData = {
  id: string;
  commune_id: string;
  intended_role: string;
  email: string;
  accepted_at: string | null;
  expires_at: string | null;
  commune: { name: string; insee_code: string } | null;
};

async function lookupInvitation(token: string): Promise<InviteData | null> {
  const serviceClient = await createServiceClient();
  const { data } = await serviceClient
    .from("neighbor_invites")
    .select("id, commune_id, intended_role, email, accepted_at, expires_at, commune:communes!inner(name, insee_code)")
    .eq("token", token)
    .maybeSingle();

  return data as InviteData | null;
}

function InvalidTokenCard({ message }: { message: string }) {
  return (
    <Card className="mx-auto max-w-md p-8 text-center">
      <div className="mb-4 flex justify-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-coral/15">
          <AlertTriangle className="size-6 text-coral" strokeWidth={2.25} />
        </div>
      </div>
      <h2 className="text-lg font-bold text-text">Invitation invalide</h2>
      <p className="mt-2 text-sm text-muted">{message}</p>
      <div className="mt-6 flex flex-col gap-3">
        <Button variant="secondary" href={ROUTES.inscription.root}>
          S&apos;inscrire
        </Button>
        <Button variant="ghost" href={ROUTES.connexion}>
          Se connecter
        </Button>
      </div>
    </Card>
  );
}

export async function InvitationLanding({ token }: Props) {
  const invite = await lookupInvitation(token);

  if (!invite) {
    return <InvalidTokenCard message="Ce lien d'invitation est invalide ou n'existe pas." />;
  }

  if (invite.accepted_at) {
    return <InvalidTokenCard message="Cette invitation a déjà été utilisée." />;
  }

  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return <InvalidTokenCard message="Ce lien d'invitation a expiré." />;
  }

  const communeName = invite.commune?.name ?? "la commune";
  const communeInsee = invite.commune?.insee_code ?? "";
  const roleLabel = ROLE_LABELS[invite.intended_role as MembershipRole] ?? invite.intended_role;

  const session = await getSessionContext();

  // --- Not logged in ---
  if (!session) {
    const createAccountUrl = `${ROUTES.inscription.root}?invite=${token}&commune=${encodeURIComponent(communeInsee)}&email=${encodeURIComponent(invite.email)}&showForm=1`;
    const redirectPath = `/inscription?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(invite.email)}`;
    const loginUrl = `${ROUTES.connexion}?email=${encodeURIComponent(invite.email)}&redirect=${encodeURIComponent(redirectPath)}`;

    return (
      <Card className="mx-auto max-w-md p-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-purple/15">
            <Mail className="size-6 text-purple" strokeWidth={2.25} />
          </div>
          <h2 className="text-lg font-bold text-text">
            Vous êtes invité·e à rejoindre {communeName}
          </h2>
          <p className="mt-2 text-sm text-muted">
            en tant que <span className="font-semibold text-purple">{roleLabel}</span>
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3">
          <Button className="w-full" href={createAccountUrl}>
            Créer mon compte
          </Button>
          <Button variant="secondary" className="w-full" href={loginUrl}>
            J&apos;ai déjà un compte
          </Button>
        </div>
      </Card>
    );
  }

  // --- Logged in ---
  const sessionEmail = session.profile
    ? await getSessionEmail(session.userId)
    : null;

  const displayName = session.profile.display_name
    || [session.profile.first_name, session.profile.last_name].filter(Boolean).join(" ")
    || "Utilisateur";

  // Email mismatch
  if (sessionEmail && sessionEmail.toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <Card className="mx-auto max-w-md p-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-coral/15">
            <AlertTriangle className="size-6 text-coral" strokeWidth={2.25} />
          </div>
          <h2 className="text-lg font-bold text-text">Compte incorrect</h2>
          <p className="mt-2 text-sm text-muted">
            Cette invitation a été envoyée à <span className="font-semibold">{invite.email}</span>,
            mais vous êtes connecté·e en tant que <span className="font-semibold">{sessionEmail}</span>.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <SignOutButton redirectTo={`/inscription?invite=${token}`} />
          <Button variant="ghost" className="w-full" href={ROUTES.accueil}>
            Retour à l&apos;accueil
          </Button>
        </div>
      </Card>
    );
  }

  // Already a member of the commune
  const existingMembership = session.memberships.find(
    (m) => m.commune_id === invite.commune_id && m.status === "active",
  );

  if (existingMembership) {
    return (
      <Card className="mx-auto max-w-md p-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-mint/15">
            <UserCheck className="size-6 text-mint" strokeWidth={2.25} />
          </div>
          <h2 className="text-lg font-bold text-text">
            Vous êtes déjà membre de {communeName}
          </h2>
          <p className="mt-2 text-sm text-muted">
            Bonne nouvelle, vous faites déjà partie de la commune !
          </p>
        </div>
        <div className="mt-6">
          <Button className="w-full" href={ROUTES.accueil}>
            Accéder à {communeName}
          </Button>
        </div>
      </Card>
    );
  }

  // Ready to accept — show address form
  return (
    <Card className="mx-auto max-w-md p-8">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-purple/15">
          <Mail className="size-6 text-purple" strokeWidth={2.25} />
        </div>
        <h2 className="text-lg font-bold text-text">
          Vous êtes invité·e à rejoindre {communeName}
        </h2>
        <p className="mt-2 text-sm text-muted">
          en tant que <span className="font-semibold text-purple">{roleLabel}</span>
        </p>
        <p className="mt-1 text-xs text-subtle">
          Connecté·e en tant que {displayName} ({sessionEmail})
        </p>
      </div>
      <div className="mt-6">
        <InvitationAddressForm
          communeName={communeName}
          communeCitycode={communeInsee}
          inviteToken={token}
        />
      </div>
    </Card>
  );
}

async function getSessionEmail(userId: string): Promise<string | null> {
  const serviceClient = await createServiceClient();
  const { data } = await serviceClient.auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}
