import { InscriptionLayoutShell } from "@/components/features/auth/inscription-layout-shell";
import { InscriptionSignupForm } from "@/components/features/auth/inscription-signup-form";

export default function InscriptionPage() {
  return (
    <InscriptionLayoutShell>
      <InscriptionSignupForm />
    </InscriptionLayoutShell>
  );
}
