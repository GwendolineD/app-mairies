import Image from "next/image";
import { AppNameHighlight } from "@/components/features/auth/app-name-highlight";
import { AuthFeaturesBlock } from "@/components/features/auth/auth-features-block";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants/app";
import { ASSETS } from "@/lib/constants/assets";
import { ILLUSTRATIONS } from "@/lib/constants/illustrations";
import { ROUTES } from "@/lib/constants/routes";

export default function LandingPage() {
  const background = ILLUSTRATIONS.auth.background;

  return (
    <div className="relative min-h-dvh">
      {background ? (
        <Image
          src={background}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_42%]"
        />
      ) : null}

      <div
        className="pointer-events-none absolute inset-0 bg-background/35"
        aria-hidden
      />

      <header className="relative z-10 flex items-start justify-between gap-4 px-5 py-4 md:px-8">
        <Image
          src={ASSETS.logoVertical}
          alt={`${APP_NAME} — Découvrir, Partager, S'entraider`}
          width={480}
          height={640}
          priority
          unoptimized
          className="ml-4 h-auto w-24 max-w-full object-contain sm:ml-8 sm:w-28 md:ml-12"
        />

        <div className="flex shrink-0 items-start gap-2 sm:gap-3">
          <Button
            href={ROUTES.connexion}
            variant="secondary"
            size="sm"
            className="shadow-card"
          >
            Connexion
          </Button>
          <Button href={ROUTES.inscription.root} size="sm">
            Créer un compte
          </Button>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-lg flex-col gap-8 px-5 pb-10 pt-4 sm:max-w-xl sm:pt-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="mx-auto w-full max-w-xs sm:max-w-sm">
            <h1 className="mb-6 text-balance text-[1.75rem] font-extrabold leading-[1.2] tracking-tight text-text sm:text-[2rem]">
              L&apos;aventure commence juste à côté !
            </h1>
            <p className="text-pretty text-sm font-medium leading-5 text-text sm:text-base sm:leading-6">
              <AppNameHighlight>{APP_NAME}</AppNameHighlight>{" "}
              est la plateforme de votre commune pour créer du lien, partager des
              idées et s&apos;entraider au quotidien
            </p>
          </div>
        </div>

        <section className="mt-8">
          <AuthFeaturesBlock title="Comment ça marche ?" />
        </section>
      </main>
    </div>
  );
}
