import { ConnexionLayoutShell } from "@/components/features/auth/connexion-layout-shell";
import { ConnexionForm } from "@/components/features/connexion-form";

export default function ConnexionPage() {
  return (
    <ConnexionLayoutShell>
      <ConnexionForm />
    </ConnexionLayoutShell>
  );
}
