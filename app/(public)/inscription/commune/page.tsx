import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { getSessionContext } from "@/lib/auth/session";
import { InscriptionLayoutShell } from "@/components/features/auth/inscription-layout-shell";
import { JoinCommuneFlow } from "@/components/features/join-commune-flow";

export default async function InscriptionCommunePage() {
  const ctx = await getSessionContext();

  if (!ctx) {
    redirect(ROUTES.inscription.root);
  }

  return (
    <InscriptionLayoutShell>
      <JoinCommuneFlow existingMemberships={ctx.memberships} />
    </InscriptionLayoutShell>
  );
}
