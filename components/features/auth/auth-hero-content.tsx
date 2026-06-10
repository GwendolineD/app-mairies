import Image from "next/image";
import { Handshake, Map, Star } from "lucide-react";
import { AppNameHighlight } from "@/components/features/auth/app-name-highlight";
import { APP_NAME } from "@/lib/constants/app";
import { ILLUSTRATIONS } from "@/lib/constants/illustrations";
import { cn } from "@/lib/utils/cn";

const FEATURES = [
  {
    icon: Map,
    iconClass: "text-purple",
    bgClass: "bg-purple/15",
    title: "Découvrir",
    description:
      "Explorez les besoins, initiatives et événements près de chez vous",
  },
  {
    icon: Star,
    iconClass: "text-orange",
    bgClass: "bg-orange/15",
    title: "Partager",
    description:
      "Proposez votre aide, vos idées ou vos objets à la communauté",
  },
  {
    icon: Handshake,
    iconClass: "text-[color-mix(in_srgb,var(--mint)_70%,var(--text))]",
    bgClass: "bg-mint/22",
    title: "S'entraider",
    description:
      "Échangez, collaborez et faites grandir votre commune ensemble",
  },
] as const;

type Props = {
  className?: string;
};

export function AuthHeroContent({ className }: Props) {
  const logo = ILLUSTRATIONS.auth.logoHorizontal;

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col px-8 pb-10 pt-5 md:px-10 md:pb-8 md:pt-6",
        className,
      )}
    >
      {logo ? (
        <Image
          src={logo}
          alt={`Logo ${APP_NAME}`}
          width={320}
          height={96}
          priority
          style={{ width: "auto" }}
          className="h-20 max-w-[min(100%,20rem)] shrink-0 object-contain object-left md:ml-12 md:h-24 md:max-w-[22rem]"
        />
      ) : null}

      <div className="mx-auto max-w-[17rem] space-y-3 pt-4 md:max-w-[18rem] md:pt-5">
        <h1 className="text-[1.75rem] font-bold leading-[1.2] tracking-tight text-text md:text-[2rem] lg:text-[2.125rem]">
          Bienvenue sur <AppNameHighlight>{APP_NAME}</AppNameHighlight>
          {" !"}
        </h1>
      </div>

      <div className="mt-auto pt-8 md:pt-6">
        <div className="mx-auto w-full max-w-xl rounded-xl bg-surface/90 p-3 shadow-card backdrop-blur-sm md:p-4">
          <ul className="grid grid-cols-3 gap-4 md:gap-6">
            {FEATURES.map((feature) => (
              <li
                key={feature.title}
                className="flex min-w-0 flex-col items-center gap-2 text-center"
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full md:size-11",
                    feature.bgClass,
                  )}
                >
                  <feature.icon
                    className={cn(
                      "size-[18px] md:size-5",
                      feature.iconClass,
                    )}
                    strokeWidth={2.25}
                    aria-hidden
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-text md:text-sm">
                    {feature.title}
                  </p>
                  <p className="mt-0.5 hidden text-[9px] font-medium leading-snug text-muted md:block md:text-[10px]">
                    {feature.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
