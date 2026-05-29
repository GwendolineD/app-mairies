import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ConnexionLayoutShell } from "@/components/features/auth/connexion-layout-shell";
import { NewPasswordForm } from "@/components/features/auth/new-password-form";
import { RECOVERY_COOKIE_NAME } from "@/lib/constants/auth";
import { ROUTES } from "@/lib/constants/routes";

export default async function NouveauMotDePassePage() {
  const cookieStore = await cookies();
  if (!cookieStore.get(RECOVERY_COOKIE_NAME)) {
    redirect(ROUTES.connexionForgotPassword);
  }

  return (
    <ConnexionLayoutShell>
      <NewPasswordForm />
    </ConnexionLayoutShell>
  );
}
