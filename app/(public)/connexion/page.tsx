import { ConnexionLayoutShell } from "@/components/features/auth/connexion-layout-shell";
import { ConnexionForm } from "@/components/features/connexion-form";

type Props = {
  searchParams: Promise<{
    error?: string;
    confirmed?: string;
    account_deleted?: string;
    redirect?: string;
    email?: string;
  }>;
};

export default async function ConnexionPage({ searchParams }: Props) {
  const params = await searchParams;
  const callbackError =
    params.error === "auth_callback_recovery"
      ? ("recovery" as const)
      : params.error === "auth_callback"
        ? ("generic" as const)
        : undefined;
  const emailConfirmed = params.confirmed === "1";
  const accountDeleted = params.account_deleted === "1";
  const redirectTo = typeof params.redirect === "string" ? params.redirect : undefined;
  const prefillEmail = typeof params.email === "string" ? params.email : undefined;

  return (
    <ConnexionLayoutShell>
      <ConnexionForm
        callbackError={callbackError}
        emailConfirmed={emailConfirmed}
        accountDeleted={accountDeleted}
        redirectTo={redirectTo}
        prefillEmail={prefillEmail}
      />
    </ConnexionLayoutShell>
  );
}
