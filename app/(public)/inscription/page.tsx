import { InscriptionLayoutShell } from "@/components/features/auth/inscription-layout-shell";
import { InscriptionSignupForm } from "@/components/features/auth/inscription-signup-form";
import { InvitationLanding } from "@/components/features/auth/invitation-landing";
import { createServiceClient } from "@/lib/supabase/server";
import { ROLE_LABELS } from "@/lib/constants/roles";
import type { MembershipRole } from "@/lib/types";

async function resolveInviteForForm(token: string) {
  const serviceClient = await createServiceClient();
  const { data } = await serviceClient
    .from("neighbor_invites")
    .select("id, commune_id, intended_role, email, accepted_at, expires_at, commune:communes!inner(name, insee_code)")
    .eq("token", token)
    .maybeSingle();

  if (!data) return null;
  if (data.accepted_at) return null;
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) return null;

  const commune = data.commune as unknown as { name: string; insee_code: string } | null;
  return {
    communeName: commune?.name ?? "",
    communeInsee: commune?.insee_code ?? "",
    roleLabel: ROLE_LABELS[data.intended_role as MembershipRole] ?? data.intended_role,
    email: data.email,
  };
}

export default async function InscriptionPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await props.searchParams) ?? {};
  const inviteToken = typeof sp.invite === "string" ? sp.invite : undefined;
  const showForm = sp.showForm === "1";
  const prefillCommune = typeof sp.commune === "string" ? sp.commune : undefined;
  const prefillEmail = typeof sp.email === "string" ? sp.email : undefined;

  // Invite token present and not explicitly asked to show the signup form
  if (inviteToken && !showForm) {
    return (
      <InscriptionLayoutShell centerContent>
        <InvitationLanding token={inviteToken} />
      </InscriptionLayoutShell>
    );
  }

  // When redirected from "Créer mon compte" on the invitation landing
  const inviteData = inviteToken ? await resolveInviteForForm(inviteToken) : null;

  return (
    <InscriptionLayoutShell>
      <InscriptionSignupForm
        prefillInseeCode={inviteData?.communeInsee ?? prefillCommune}
        prefillEmail={inviteData?.email ?? prefillEmail}
        inviteToken={inviteToken}
        inviteCommuneName={inviteData?.communeName}
        inviteRoleLabel={inviteData?.roleLabel}
      />
    </InscriptionLayoutShell>
  );
}
