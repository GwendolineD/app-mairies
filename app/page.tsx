import Image from "next/image";
import { AppNameHighlight } from "@/components/features/auth/app-name-highlight";
import { AuthFeaturesBlock } from "@/components/features/auth/auth-features-block";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants/app";
import { ILLUSTRATIONS } from "@/lib/constants/illustrations";
import { ROUTES } from "@/lib/constants/routes";

export default function LandingPage() {
  const background = ILLUSTRATIONS.auth.background;
  const logo = ILLUSTRATIONS.auth.logoHorizontal;

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

      <header className="relative z-10 flex items-start justify-between gap-3 px-5 py-4 md:gap-4 md:px-8">
        {logo ? (
          <Image
            src={logo}
            alt={`Logo ${APP_NAME}`}
            width={320}
            height={96}
            priority
            style={{ width: "auto" }}
            className="ml-1 h-10 max-w-[min(100%,11rem)] shrink-0 object-contain object-left md:ml-12 md:h-20 md:max-w-[18rem]"
          />
        ) : null}

        <div className="hidden shrink-0 flex-col items-stretch gap-2.5 md:flex md:flex-row md:items-start md:gap-3">
          <Button
            href={ROUTES.connexion}
            variant="secondary"
            size="sm"
            className="shadow-card px-4 py-2 text-sm md:px-4 md:py-1.5 md:text-sm"
          >
            Connexion
          </Button>
          <Button
            href={ROUTES.inscription.root}
            size="sm"
            className="px-4 py-2 text-sm md:px-4 md:py-1.5 md:text-sm"
          >
            Créer un compte
          </Button>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-lg flex-col gap-4 px-5 pb-10 pt-4 sm:max-w-xl md:gap-8 sm:pt-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="mx-auto w-full max-w-xs sm:max-w-sm">
            <h1 className="mb-6 text-balance text-[2rem] font-extrabold leading-[1.2] tracking-tight text-text sm:text-[2.5rem]">
              L&apos;aventure commence juste à côté !
            </h1>
            <p className="text-pretty text-sm font-medium leading-5 text-text sm:text-base sm:leading-6">
              <AppNameHighlight>{APP_NAME}</AppNameHighlight>{" "}
              est la plateforme de votre commune pour créer du lien, partager des
              idées et s&apos;entraider au quotidien
            </p>
          </div>
        </div>

        <section className="md:mt-8">
          <AuthFeaturesBlock title="Comment ça marche ?" />
        </section>

        <div className="flex gap-2.5 md:hidden">
          <Button
            href={ROUTES.connexion}
            variant="secondary"
            size="sm"
            className="shadow-card flex-1 px-4 py-2.5 text-sm"
          >
            Connexion
          </Button>
          <Button
            href={ROUTES.inscription.root}
            size="sm"
            className="flex-1 px-4 py-2.5 text-sm"
          >
            Créer un compte
          </Button>
        </div>
      </main>
    </div>
  );
}
