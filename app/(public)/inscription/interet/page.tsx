import Link from "next/link";
import { Card } from "@/components/ui/card";
import { InteretCommuneClient } from "@/components/features/interet-commune-client";

export default function InteretFallbackPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text">Intérêt pour ma commune</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Si votre commune était absente ou incertaine lors de la recherche précédente,
          réessayez depuis cette page puis laissez un e-mail&nbsp;: nous suivrons avec vos
          élu·es.
        </p>
      </div>
      <Card className="space-y-4 p-6">
        <InteretCommuneClient />
      </Card>
      <p className="text-center text-sm text-muted">
        <Link href="/inscription" className="font-semibold text-purple">
          Retour à l&apos;inscription avec vérification d&apos;abonnement
        </Link>
      </p>
    </div>
  );
}
