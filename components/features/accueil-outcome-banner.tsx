"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  HandHeart,
  Heart,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import type { BannerSlide } from "@/lib/queries/dashboard-charts";
import { cn } from "@/lib/utils/cn";

type Props = {
  slides: BannerSlide[];
};

type SlideTheme = {
  Icon: LucideIcon;
  containerClass: string;
  iconWrapClass: string;
  heartClass: string;
  dotClass: string;
  buildTitle: (count: number, period: BannerSlide["period"]) => string;
  buildSubtitle: () => string;
};

const PERIOD_LABEL: Record<BannerSlide["period"], string> = {
  week: "cette semaine",
  month: "ce mois-ci",
};

const DEMANDES_SUBTITLE =
  "Ensemble, notre commune est plus humaine — merci à tou·tes celles et ceux qui participent !";

const OFFRES_SUBTITLE =
  "Ensemble, notre commune est plus solidaire — merci à tou·tes celles et ceux qui participent !";

const EVENTS_SUBTITLE =
  "Ensemble, notre commune est vivante — merci à tou·tes celles et ceux qui la font vivre !";

const SLIDE_THEMES: Record<BannerSlide["key"], SlideTheme> = {
  demandes: {
    Icon: Megaphone,
    containerClass: "border-coral/30 bg-coral/5",
    iconWrapClass: "bg-coral/15 text-coral",
    heartClass: "text-coral",
    dotClass: "bg-coral",
    buildTitle: (count, period) =>
      count === 1
        ? `1 voisin a trouvé l'aide qu'il cherchait ${PERIOD_LABEL[period]}`
        : `${count} voisins ont trouvé l'aide qu'ils cherchaient ${PERIOD_LABEL[period]}`,
    buildSubtitle: () => DEMANDES_SUBTITLE,
  },
  offres: {
    Icon: HandHeart,
    containerClass: "border-turquoise/30 bg-turquoise/5",
    iconWrapClass: "bg-turquoise/15 text-turquoise",
    heartClass: "text-turquoise",
    dotClass: "bg-turquoise",
    buildTitle: (count, period) =>
      count === 1
        ? `1 offre a aidé un voisin ${PERIOD_LABEL[period]}`
        : `${count} offres ont aidé des voisins ${PERIOD_LABEL[period]}`,
    buildSubtitle: () => OFFRES_SUBTITLE,
  },
  events: {
    Icon: CalendarDays,
    containerClass: "border-orange/30 bg-orange/5",
    iconWrapClass: "bg-orange/15 text-orange",
    heartClass: "text-orange",
    dotClass: "bg-orange",
    buildTitle: (count, period) =>
      count === 1
        ? `1 événement a eu lieu ${PERIOD_LABEL[period]}`
        : `${count} événements ont eu lieu ${PERIOD_LABEL[period]}`,
    buildSubtitle: () => EVENTS_SUBTITLE,
  },
};

const ROTATION_MS = 4000;

function OutcomeSlideContent({ slide }: { slide: BannerSlide }) {
  const theme = SLIDE_THEMES[slide.key];
  const Icon = theme.Icon;

  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          theme.iconWrapClass,
        )}
      >
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-text">
          {theme.buildTitle(slide.count, slide.period)}
        </p>
        <p className="flex items-center gap-1 text-sm font-medium text-muted">
          <span>{theme.buildSubtitle()}</span>
          <Heart
            className={cn("size-4 shrink-0 fill-current", theme.heartClass)}
            aria-hidden
          />
        </p>
      </div>
    </div>
  );
}

export function AccueilOutcomeBanner({ slides }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  const isCarousel = slides.length > 1;
  const loopSlides = useMemo(
    () => (isCarousel ? [...slides, slides[0]] : slides),
    [isCarousel, slides],
  );
  const visibleSlideIndex = activeIndex % slides.length;

  const goToNextSlide = useCallback(() => {
    if (!isCarousel) return;

    if (reduceMotion) {
      setActiveIndex((prev) => (prev + 1) % slides.length);
      return;
    }

    setActiveIndex((prev) => Math.min(prev + 1, slides.length));
  }, [isCarousel, reduceMotion, slides.length]);

  useEffect(() => {
    setActiveIndex(0);
    setTransitionEnabled(true);
  }, [slides]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (!isCarousel || reduceMotion) return;

    const timer = window.setInterval(goToNextSlide, ROTATION_MS);
    return () => window.clearInterval(timer);
  }, [isCarousel, reduceMotion, goToNextSlide, activeIndex]);

  useEffect(() => {
    if (!transitionEnabled) {
      const frame = window.requestAnimationFrame(() => setTransitionEnabled(true));
      return () => window.cancelAnimationFrame(frame);
    }
  }, [transitionEnabled]);

  function handleTrackTransitionEnd(event: React.TransitionEvent<HTMLDivElement>) {
    if (event.propertyName !== "transform" || activeIndex !== slides.length) return;
    setTransitionEnabled(false);
    setActiveIndex(0);
  }

  if (slides.length === 0) return null;

  const activeSlide = slides[visibleSlideIndex] ?? slides[0];
  const activeTheme = SLIDE_THEMES[activeSlide.key];

  function handleBannerKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!isCarousel) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToNextSlide();
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border shadow-card p-4 transition-colors duration-300 md:p-5",
        activeTheme.containerClass,
        isCarousel && "cursor-pointer",
      )}
      aria-live="polite"
      role={isCarousel ? "button" : undefined}
      tabIndex={isCarousel ? 0 : undefined}
      aria-label={
        isCarousel
          ? "Statistique d'entraide — appuyer pour voir la suivante"
          : undefined
      }
      onClick={isCarousel ? goToNextSlide : undefined}
      onKeyDown={handleBannerKeyDown}
    >
      {slides.length === 1 ? (
        <OutcomeSlideContent slide={slides[0]} />
      ) : (
        <>
          <div className="overflow-hidden">
            <div
              className={cn(
                "flex ease-out motion-reduce:transition-none",
                transitionEnabled && "transition-transform duration-300",
              )}
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              onTransitionEnd={handleTrackTransitionEnd}
            >
              {loopSlides.map((slide, index) => (
                <div
                  key={index === slides.length ? `${slide.key}-clone` : slide.key}
                  className="w-full shrink-0"
                  aria-hidden={index !== activeIndex}
                >
                  <OutcomeSlideContent slide={slide} />
                </div>
              ))}
            </div>
          </div>

          <div
            className="flex justify-center gap-1.5 pt-3"
            role="tablist"
            aria-label="Indicateurs des statistiques d'entraide"
          >
            {slides.map((slide, index) => (
              <span
                key={slide.key}
                role="tab"
                aria-selected={index === visibleSlideIndex}
                aria-label={`Information ${index + 1} sur ${slides.length}`}
                className={cn(
                  "size-1.5 rounded-full transition-colors",
                  index === visibleSlideIndex
                    ? SLIDE_THEMES[slide.key].dotClass
                    : "bg-border",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
