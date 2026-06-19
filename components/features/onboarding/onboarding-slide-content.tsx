"use client";

import Image from "next/image";
import { Handshake, MessageCircle, PartyPopper, HandHeart, Lightbulb, Rocket } from "lucide-react";
import { ILLUSTRATIONS } from "@/lib/constants/illustrations";
import { homemadeApple } from "@/lib/fonts";
import { cn } from "@/lib/utils/cn";

export type OnboardingSlideId = "welcome" | "annonces" | "initiatives" | "evenements";

type Props = {
  slide: OnboardingSlideId;
  communeName?: string;
};

function WelcomeSlide({ communeName }: { communeName: string }) {
  const heartUrl = ILLUSTRATIONS.resident.onboarding.heart;

  return (
    <div className="flex flex-col items-start text-left">
      <p className="mb-5 text-2xl font-bold">Bienvenue 👋</p>
      <h2 className="w-[70%] text-xl font-bold text-purple">
        {communeName} prend vie grâce à vous !
      </h2>
      <p className="mt-3 w-4/5 text-sm font-medium leading-relaxed text-text">
        Ici, vos voisins partagent, s&apos;entraident et font bouger les choses
        ensemble. Rejoignez-les.
      </p>
      <p
        className={cn(
          "mt-4 inline-flex -rotate-2 items-center gap-2 text-base font-bold text-text/80",
          homemadeApple.className,
        )}
      >
        Chaque petit geste compte
        {heartUrl ? (
          <Image
            src={heartUrl}
            alt=""
            width={36}
            height={36}
            className="size-9 shrink-0 object-contain"
          />
        ) : null}
      </p>
    </div>
  );
}

function AnnoncesSlide() {
  return (
    <div className="flex flex-col items-start text-left">
      <h2 className="mb-2 text-2xl font-bold text-text">
        Besoin d&apos;aide ?
        <br />
        Envie d&apos;aider ?
      </h2>
      <p className="mt-2 mb-2 w-4/5 text-sm font-medium text-purple">
        En quelques clics, publiez ou répondez.
      </p>
      <div className="mt-5 flex w-[85%] flex-col gap-4">
        <ActionBlock
          icon={<HandHeart className="size-4 text-pink" />}
          title="Vous avez du temps ou du matériel ?"
          subtitle="Proposez votre aide"
          size="sm"
        />
        <ActionBlock
          icon={<Handshake className="size-4 text-orange" />}
          title="Un coup de main, ça change tout"
          subtitle="Publiez votre demande"
          size="sm"
        />
        <ActionBlock
          icon={<MessageCircle className="size-4 text-turquoise" />}
          title="Un voisin a besoin de vous"
          subtitle="Répondez à son annonce"
          size="sm"
        />
      </div>
    </div>
  );
}

function InitiativesSlide() {
  return (
    <div className="flex flex-col items-start text-left">
      <h2 className="mb-3 text-2xl font-bold text-text">
        Une idée ?
        <br />
        Partagez-la !
      </h2>
      <p className="mt-[15px] mb-[20px] w-4/5 text-sm font-medium text-purple">
        Un jardin partagé, un vide-grenier, un apéro de quartier…
      </p>
      <div className="mb-[50px] mt-4 flex w-full flex-col gap-4">
        <ActionBlock
          icon={<Lightbulb className="size-5 text-sun" />}
          title={
            <>
              Vos voisins peuvent la <strong>soutenir</strong>, en <strong>discuter</strong> avec vous, et vous aider à la <strong>concrétiser</strong>.
            </>
          }
        />
        <ActionBlock
          icon={<Rocket className="size-5 text-purple" />}
          title="Les meilleures initiatives deviennent de vrais événements 🚀"
        />
      </div>
    </div>
  );
}

function EvenementsSlide({ communeName }: { communeName: string }) {
  const heartUrl = ILLUSTRATIONS.resident.onboarding.heart;

  return (
    <div className="flex flex-col items-start text-left">
      <h2 className="mb-3 w-[60%] text-xl font-bold text-text">
        Restez connecté·e à votre commune
      </h2>
      <p className="mb-4 mt-2 w-[70%] text-sm font-medium text-purple">
        Découvrez les événements près de chez vous
      </p>
      <div className="mt-5 flex w-full flex-col gap-4">
        <ActionBlock
          icon={<PartyPopper className="size-5 text-orange" />}
          title="Participez"
          subtitle="Inscrivez-vous en un clic"
        />
        <ActionBlock
          icon={<HandHeart className="size-5 text-[color-mix(in_srgb,var(--mint)_80%,var(--text))]" />}
          title="Donnez un coup de main"
          subtitle="Devenez bénévole"
        />
      </div>
      <p
        className={cn(
          "my-6 flex -rotate-2 items-center self-center gap-2 text-base font-bold text-text/80",
          homemadeApple.className,
        )}
      >
        <span className="flex flex-col gap-0.5 text-left">
          <span>Ensemble,</span>
          <span>faisons vivre {communeName}</span>
        </span>
        {heartUrl ? (
          <Image
            src={heartUrl}
            alt=""
            width={36}
            height={36}
            className="size-9 shrink-0 object-contain"
          />
        ) : null}
      </p>
    </div>
  );
}

function ActionBlock({
  icon,
  title,
  subtitle,
  size = "default",
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle?: string;
  size?: "default" | "sm";
}) {
  const isSmall = size === "sm";

  return (
    <div
      className={cn(
        "flex items-center border border-border/60 bg-warm/70",
        isSmall ? "gap-2 rounded-lg px-3 py-2" : "gap-3 rounded-xl px-4 py-3",
      )}
    >
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        {subtitle ? (
          <>
            <p className={cn("font-semibold text-text", isSmall ? "text-xs" : "text-sm")}>
              {title}
            </p>
            <p className={cn("text-muted", isSmall ? "text-[11px]" : "text-xs")}>
              {subtitle}
            </p>
          </>
        ) : (
          <p className={cn("font-medium text-text", isSmall ? "text-xs" : "text-sm")}>
            {title}
          </p>
        )}
      </div>
    </div>
  );
}

export function OnboardingSlideContent({ slide, communeName = "votre commune" }: Props) {
  switch (slide) {
    case "welcome":
      return <WelcomeSlide communeName={communeName} />;
    case "annonces":
      return <AnnoncesSlide />;
    case "initiatives":
      return <InitiativesSlide />;
    case "evenements":
      return <EvenementsSlide communeName={communeName} />;
  }
}
