import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";
import { Card } from "@/components/ui/card";
import { InteretCommuneClient } from "@/components/features/interet-commune-client";
import { PageHeading } from "@/components/ui/page-heading";

export default function InteretFallbackPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-4">
      <PageHeading
        centered
        title="Intérêt pour ma commune"
        subtitle="Si votre commune était absente ou incertaine lors de la recherche précédente, réessayez depuis cette page puis laissez un e-mail : nous suivrons avec vos élu·es."
      />
      <Card className="space-y-4 p-6">
        <InteretCommuneClient />
      </Card>
      <p className="text-center text-sm font-medium text-muted">
        <Link href={ROUTES.inscription.root} className="font-semibold text-purple underline">
          Retour à l&apos;inscription avec vérification d&apos;abonnement
        </Link>
      </p>
    </div>
  );
}
