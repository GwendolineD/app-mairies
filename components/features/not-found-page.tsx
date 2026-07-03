import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CloudImage } from "@/components/ui/cloud-image";
import { ILLUSTRATIONS } from "@/lib/constants/illustrations";
import { ROUTES } from "@/lib/constants/routes";
import { getNotFoundIllustrationUrl } from "@/lib/queries/platform-settings";

export async function NotFoundPage() {
  const configuredUrl = await getNotFoundIllustrationUrl();
  const illustrationUrl =
    configuredUrl ?? ILLUSTRATIONS.resident.accueil.nudgeEmpathique;

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md space-y-4 p-8 text-center">
        <div className="relative mx-auto aspect-4/3 min-h-32 w-full max-w-xs overflow-hidden rounded-2xl bg-warm">
          <CloudImage
            src={illustrationUrl}
            alt=""
            fill
            sizes="320px"
            className="object-contain"
          />
        </div>
        <h1 className="text-xl font-bold text-text">Cette page est introuvable</h1>
        <p className="text-sm text-muted">
          Pas d&apos;inquiétude — revenez à l&apos;accueil pour retrouver votre
          commune et vos voisin·es.
        </p>
        <div className="flex justify-center">
          <Button variant="primary" href={ROUTES.accueil}>
            Retour à l&apos;accueil
          </Button>
        </div>
      </Card>
    </div>
  );
}
