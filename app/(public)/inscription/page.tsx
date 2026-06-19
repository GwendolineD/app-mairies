import { InscriptionLayoutShell } from "@/components/features/auth/inscription-layout-shell";
import { InscriptionSignupForm } from "@/components/features/auth/inscription-signup-form";

export default async function InscriptionPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await props.searchParams) ?? {};
  const prefillCommune = typeof sp.commune === "string" ? sp.commune : undefined;
  const prefillCode = typeof sp.code === "string" ? sp.code : undefined;
  const prefillEmail = typeof sp.email === "string" ? sp.email : undefined;

  return (
    <InscriptionLayoutShell>
      <InscriptionSignupForm
        prefillInseeCode={prefillCommune}
        prefillTrialCode={prefillCode}
        prefillEmail={prefillEmail}
      />
    </InscriptionLayoutShell>
  );
}
