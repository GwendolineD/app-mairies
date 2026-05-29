import { ConnexionLayoutShell } from "@/components/features/auth/connexion-layout-shell";
import { ForgotPasswordForm } from "@/components/features/auth/forgot-password-form";

export default function MotDePasseOubliePage() {
  return (
    <ConnexionLayoutShell>
      <ForgotPasswordForm />
    </ConnexionLayoutShell>
  );
}
