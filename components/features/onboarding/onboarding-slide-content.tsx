"use client";

import Image from "next/image";
import { Handshake, Gift, MessageCircle, PartyPopper, HandHeart, Lightbulb, Rocket } from "lucide-react";
import { ILLUSTRATIONS } from "@/lib/constants/illustrations";
import { AssetPlaceholder } from "@/components/ui/asset-placeholder";
import { cn } from "@/lib/utils/cn";

export type OnboardingSlideId = "welcome" | "annonces" | "initiatives" | "evenements";

type Props = {
  slide: OnboardingSlideId;
  communeName?: string;
  /** compact = popover usage (no illustration, reduced spacing) */
  mode?: "full" | "compact";
};

function SlideIllustration({ slide }: { slide: OnboardingSlideId }) {
  const url = ILLUSTRATIONS.resident.onboarding[slide];
  if (!url) {
    return (
      <AssetPlaceholder
        description={`Illustration onboarding — ${slide}`}
        className="mx-auto h-36 w-56 shrink-0"
      />
    );
  }
  return (
    <Image
      src={url}
      alt=""
      width={224}
      height={144}
      className="mx-auto h-36 w-auto shrink-0 object-contain"
    />
  );
}

function WelcomeSlide({ communeName, mode }: { communeName: string; mode: "full" | "compact" }) {
  return (
    <div className="flex flex-col items-center text-center">
      {mode === "full" && <SlideIllustration slide="welcome" />}
      <p className="mt-4 text-2xl">👋</p>
      <h2 className="mt-2 text-xl font-bold text-text">
        {communeName} prend vie grâce à vous !
      </h2>
      <p className="mt-3 text-sm font-medium leading-relaxed text-muted">
        Ici, vos voisins partagent, s&apos;entraident et font bouger les choses
        ensemble. Rejoignez-les.
      </p>
      <p className="mt-4 text-base italic text-text/80">
        Chaque petit geste compte 💛
      </p>
    </div>
  );
}

function AnnoncesSlide({ mode }: { mode: "full" | "compact" }) {
  return (
    <div className="flex flex-col">
      {mode === "full" && <SlideIllustration slide="annonces" />}
      <h2 className={cn("font-bold text-text", mode === "full" ? "mt-4 text-xl text-center" : "text-base")}>
        Besoin d&apos;aide ? Envie d&apos;aider ?
      </h2>
      <p className={cn("font-medium text-muted", mode === "full" ? "mt-1 text-sm text-center" : "mt-1 text-xs")}>
        En quelques clics, publiez ou répondez.
      </p>
      <div className={cn("flex flex-col", mode === "full" ? "mt-5 gap-3" : "mt-3 gap-2")}>
        <ActionBlock
          icon={<Handshake className="size-5 text-orange" />}
          title="Un coup de main, ça change tout"
          subtitle="Publiez votre demande"
          mode={mode}
        />
        <ActionBlock
          icon={<Gift className="size-5 text-pink" />}
          title="Vous avez du temps ou du matériel ?"
          subtitle="Proposez votre aide"
          mode={mode}
        />
        <ActionBlock
          icon={<MessageCircle className="size-5 text-turquoise" />}
          title="Un voisin a besoin de vous"
          subtitle="Répondez à son annonce"
          mode={mode}
        />
      </div>
    </div>
  );
}

function InitiativesSlide({ mode }: { mode: "full" | "compact" }) {
  return (
    <div className="flex flex-col">
      {mode === "full" && <SlideIllustration slide="initiatives" />}
      <h2 className={cn("font-bold text-text", mode === "full" ? "mt-4 text-xl text-center" : "text-base")}>
        Une idée ? Partagez-la !
      </h2>
      <p className={cn("font-medium text-muted", mode === "full" ? "mt-2 text-sm text-center" : "mt-1 text-xs")}>
        Un jardin partagé, un vide-grenier, un apéro de quartier…
      </p>
      <div className={cn("flex flex-col items-center", mode === "full" ? "mt-4 gap-2" : "mt-3 gap-1.5")}>
        <div className="flex items-center gap-2">
          <Lightbulb className="size-4 text-sun" />
          <span className="text-sm font-medium text-text">
            Vos voisins peuvent la <strong>soutenir</strong>, en <strong>discuter</strong> avec vous, et vous aider à la <strong>concrétiser</strong>.
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Rocket className="size-4 text-purple" />
          <span className="text-sm font-medium text-muted">
            Les meilleures initiatives deviennent de vrais événements 🚀
          </span>
        </div>
      </div>
    </div>
  );
}

function EvenementsSlide({ communeName, mode }: { communeName: string; mode: "full" | "compact" }) {
  return (
    <div className="flex flex-col">
      {mode === "full" && <SlideIllustration slide="evenements" />}
      <h2 className={cn("font-bold text-text", mode === "full" ? "mt-4 text-xl text-center" : "text-base")}>
        Restez connecté·e à votre commune
      </h2>
      <p className={cn("font-medium text-muted", mode === "full" ? "mt-1 text-sm text-center" : "mt-1 text-xs")}>
        Découvrez les événements près de chez vous
      </p>
      <div className={cn("flex flex-col", mode === "full" ? "mt-5 gap-3" : "mt-3 gap-2")}>
        <ActionBlock
          icon={<PartyPopper className="size-5 text-orange" />}
          title="Participez"
          subtitle="Inscrivez-vous en un clic"
          mode={mode}
        />
        <ActionBlock
          icon={<HandHeart className="size-5 text-mint" />}
          title="Donnez un coup de main"
          subtitle="Devenez bénévole"
          mode={mode}
        />
      </div>
      <p className={cn("italic text-text/80", mode === "full" ? "mt-5 text-center text-base" : "mt-3 text-sm")}>
        Ensemble, faisons vivre {communeName} 💛
      </p>
    </div>
  );
}

function ActionBlock({
  icon,
  title,
  subtitle,
  mode,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  mode: "full" | "compact";
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl border border-border/60 bg-warm/50",
      mode === "full" ? "px-4 py-3" : "px-3 py-2",
    )}>
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className={cn("font-semibold text-text", mode === "full" ? "text-sm" : "text-xs")}>
          {title}
        </p>
        <p className={cn("text-muted", mode === "full" ? "text-xs" : "text-[11px]")}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export function OnboardingSlideContent({ slide, communeName = "votre commune", mode = "full" }: Props) {
  switch (slide) {
    case "welcome":
      return <WelcomeSlide communeName={communeName} mode={mode} />;
    case "annonces":
      return <AnnoncesSlide mode={mode} />;
    case "initiatives":
      return <InitiativesSlide mode={mode} />;
    case "evenements":
      return <EvenementsSlide communeName={communeName} mode={mode} />;
  }
}
