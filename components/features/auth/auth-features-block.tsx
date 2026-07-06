import { Handshake, Map, Star } from "lucide-react";
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
  cardClassName?: string;
  title?: string;
};

export function AuthFeaturesBlock({
  className,
  cardClassName,
  title,
}: Props) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-xl rounded-xl bg-surface/90 px-5 py-5 shadow-card backdrop-blur-sm md:px-6 md:py-6",
        cardClassName,
        className,
      )}
    >
      {title ? (
        <h2 className="mb-8 text-center text-xl font-semibold leading-7 text-text">
          {title}
        </h2>
      ) : null}
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-8">
        {FEATURES.map((feature) => (
          <li
            key={feature.title}
            className="flex min-w-0 flex-row items-center gap-3 text-left md:flex-col md:items-center md:gap-2 md:text-center"
          >
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full md:size-11",
                feature.bgClass,
              )}
            >
              <feature.icon
                className={cn("size-[18px] md:size-5", feature.iconClass)}
                strokeWidth={2.25}
                aria-hidden
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1.5 text-xs font-bold text-text md:mb-2 md:text-sm">
                {feature.title}
              </p>
              <p className="text-[10px] font-medium leading-snug text-muted md:text-[10px]">
                {feature.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
