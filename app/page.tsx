import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 py-10 sm:max-w-lg">
        <div className="flex flex-col items-center gap-4 text-center">
          <Image
            src="/logo-vertical.png"
            alt="Vie Locale — Découvrir, Partager, S'entraider"
            width={480}
            height={640}
            priority
            className="h-auto w-44 max-w-full object-contain sm:w-48"
          />
          <h1 className="text-balance text-3xl font-extrabold leading-tight text-text">
            La vie locale de votre quartier, bienveillante et utile au quotidien.
          </h1>
          <p className="max-w-md text-pretty text-sm leading-relaxed text-muted">
            Rejoignez votre commune lorsqu&apos;elle est disponible : annonces
            voisin·es, initiatives solidaires et évènements tout près de chez
            vous.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Link
            href="/inscription"
            className="gradient-hero inline-flex h-12 w-full items-center justify-center rounded-full text-sm font-bold text-white shadow-md transition hover:opacity-95"
          >
            Créer un compte
          </Link>
          <Link
            href="/connexion"
            className="inline-flex h-12 w-full items-center justify-center rounded-full border border-border bg-surface text-sm font-semibold text-text shadow-card transition hover:bg-warm"
          >
            J&apos;ai déjà un compte
          </Link>
        </div>

        <p className="text-center text-xs text-subtle">
          Une expérience mobile d&apos;abord — chaleureuse, simple, locale.
        </p>
      </main>
    </div>
  );
}
