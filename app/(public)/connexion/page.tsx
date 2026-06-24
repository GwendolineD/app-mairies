import { ConnexionLayoutShell } from "@/components/features/auth/connexion-layout-shell";
import { ConnexionForm } from "@/components/features/connexion-form";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ConnexionPage({ searchParams }: Props) {
  const params = await searchParams;
  const callbackError =
    params.error === "auth_callback_recovery"
      ? ("recovery" as const)
      : params.error === "auth_callback"
        ? ("generic" as const)
        : undefined;

  return (
    <ConnexionLayoutShell>
      <ConnexionForm callbackError={callbackError} />
    </ConnexionLayoutShell>
  );
}
