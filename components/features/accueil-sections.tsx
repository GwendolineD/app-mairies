"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { HandHeart, Plus, Sparkles } from "lucide-react";
import { ILLUSTRATIONS } from "@/lib/constants/illustrations";
import { ROUTES } from "@/lib/constants/routes";
import { buildAnnouncementListQuery } from "@/lib/utils/search-params";
import { cn } from "@/lib/utils";
import { useCreationModals } from "@/components/features/creation-modal-context";

type Props = {
  userFirstName: string;
  demandCountToday: number;
};

function heroHeading(count: number): string {
  if (count > 0) {
    const neighbor = count > 1 ? "voisins" : "voisin";
    const verb = count > 1 ? "ont" : "a";
    return `${count} ${neighbor} ${verb} besoin d'un coup de main aujourd'hui 💛`;
  }
  return "Et si vous proposiez un coup de main à vos voisins ? 💛";
}

const heroCtaClass =
  "inline-flex w-fit cursor-pointer items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-bold text-text shadow-card transition hover:bg-white/95";

export function AccueilHero({ userFirstName, demandCountToday }: Props) {
  const { openAnnouncementModal } = useCreationModals();
  const heroUrl = ILLUSTRATIONS.resident.accueil.nudgeEmpathique;
  const hasDemandsToday = demandCountToday > 0;

  return (
    <section className="relative min-h-[200px] overflow-hidden rounded-2xl gradient-hero shadow-card md:min-h-[220px]">
      {heroUrl ? (
        <div className="pointer-events-none absolute -top-16 right-0 h-[150%] w-[min(76%,34rem)] overflow-hidden md:-top-20 lg:-top-24">
          <div className="relative h-full w-full origin-top-right scale-[1.08] md:scale-[1.12]">
            <Image
              src={heroUrl}
              alt=""
              fill
              className="object-contain object-top-right"
              sizes="(max-width: 768px) 76vw, 34rem"
              unoptimized
            />
          </div>
        </div>
      ) : null}
      <div className="relative z-10 p-5 lg:p-8">
        <div className="max-w-[min(100%,28rem)] space-y-3 md:max-w-[min(100%,32rem)] lg:max-w-[min(55%,36rem)]">
          <p className="text-sm font-semibold text-white/90">
            Bonjour {userFirstName}
          </p>
          <h2 className="text-2xl font-bold leading-8 text-white md:text-[28px] md:leading-9">
            {heroHeading(demandCountToday)}
          </h2>
          {hasDemandsToday ? (
            <Link
              href={`${ROUTES.annonces.list}${buildAnnouncementListQuery({ type: "demande", tri: "recent" })}`}
              className={heroCtaClass}
            >
              <span>Je regarde</span>
              <span aria-hidden>→</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openAnnouncementModal({ presetType: "offre" })}
              className={heroCtaClass}
            >
              <span>Je publie une annonce</span>
              <span aria-hidden>→</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

type QuickActionProps = {
  label: string;
  gradient: "gradient-demande" | "gradient-offre" | "gradient-initiative";
  icon: ReactNode;
  onClick: () => void;
};

function QuickActionCard({ label, gradient, icon, onClick }: QuickActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-border/60 bg-surface p-4 shadow-card transition hover:border-purple/40"
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full",
          gradient,
        )}
      >
        {icon}
      </span>
      <span className="font-bold text-text">{label}</span>
    </button>
  );
}

export function AccueilQuickActions() {
  const { openAnnouncementModal, openInitiativeModal } = useCreationModals();

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest text-muted">
        Participer en 1 clic
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <QuickActionCard
          label="Je demande"
          gradient="gradient-demande"
          icon={<HandHeart className="size-5 text-white" strokeWidth={2.25} aria-hidden />}
          onClick={() => openAnnouncementModal({ presetType: "demande" })}
        />
        <QuickActionCard
          label="J'offre"
          gradient="gradient-offre"
          icon={<Plus className="size-5 text-white" strokeWidth={2.5} aria-hidden />}
          onClick={() => openAnnouncementModal({ presetType: "offre" })}
        />
        <QuickActionCard
          label="Initiative"
          gradient="gradient-initiative"
          icon={<Sparkles className="size-5 text-white" strokeWidth={2.25} aria-hidden />}
          onClick={openInitiativeModal}
        />
      </div>
    </div>
  );
}

export function AccueilSectionLink({
  href,
  label,
  size = "default",
}: {
  href: string;
  label: string;
  size?: "default" | "sm";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "font-bold text-coral hover:underline",
        size === "sm" ? "text-xs" : "text-sm",
      )}
    >
      {label} →
    </Link>
  );
}
