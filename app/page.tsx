import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/page-heading";
import { ASSETS } from "@/lib/constants/assets";
import { ROUTES } from "@/lib/constants/routes";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 py-10 sm:max-w-lg">
        <div className="flex flex-col items-center gap-4 text-center">
          <Image
            src={ASSETS.logoVertical}
            alt="Vie Locale — Découvrir, Partager, S'entraider"
            width={480}
            height={640}
            priority
            unoptimized
            className="h-auto w-44 max-w-full object-contain sm:w-48"
          />
          <PageHeading
            size="hero"
            centered
            title="La vie locale de votre quartier, bienveillante et utile au quotidien."
            subtitle="Rejoignez votre commune lorsqu'elle est disponible : annonces voisin·es, initiatives solidaires et évènements tout près de chez vous."
          />
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button href={ROUTES.inscription.root} className="h-12 w-full">
            Créer un compte
          </Button>
          <Button href={ROUTES.connexion} variant="secondary" className="h-12 w-full shadow-card">
            J&apos;ai déjà un compte
          </Button>
        </div>

        <p className="text-center text-xs font-medium text-subtle">
          Une expérience mobile d&apos;abord — chaleureuse, simple, locale.
        </p>
      </main>
    </div>
  );
}
