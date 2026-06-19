"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { OnboardingSlideFrame } from "./onboarding-slide-frame";
import type { OnboardingSlideId } from "./onboarding-slide-content";

const SLIDES: OnboardingSlideId[] = ["welcome", "annonces", "initiatives", "evenements"];
const TOTAL = SLIDES.length;

type Props = {
  open: boolean;
  onComplete: () => void;
  communeName: string;
};

export function OnboardingModal({ open, onComplete, communeName }: Props) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isLast = current === TOTAL - 1;
  const activeSlide = SLIDES[current];

  const goNext = useCallback(() => {
    if (isLast) {
      onComplete();
    } else {
      setCurrent((c) => Math.min(c + 1, TOTAL - 1));
    }
  }, [isLast, onComplete]);

  const goPrev = useCallback(() => {
    setCurrent((c) => Math.max(c - 1, 0));
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, goNext, goPrev]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 50;
    if (diff < -threshold) goNext();
    if (diff > threshold) goPrev();
    touchStartX.current = null;
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={() => {}}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-1100 bg-text/40 backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup
          className="fixed inset-x-0 bottom-0 z-1100 mx-auto flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface shadow-elevated sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[min(90dvh,calc(100%-2rem))] sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl"
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <DialogPrimitive.Title className="sr-only">
            Bienvenue sur Vie Locale
          </DialogPrimitive.Title>

          {!isLast && (
            <button
              type="button"
              onClick={onComplete}
              className="absolute right-4 top-4 z-10 flex cursor-pointer items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium text-muted transition hover:text-text"
            >
              Passer
              <X className="size-3.5" />
            </button>
          )}

          <OnboardingSlideFrame
            slide={activeSlide}
            communeName={communeName}
            className="flex-1"
          />

          <div className="flex shrink-0 items-center gap-2 border-t border-border/40 px-4 py-3 sm:px-5">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={goPrev}
              disabled={current === 0}
              className="shrink-0"
            >
              <ChevronLeft className="size-3" />
              Précédent
            </Button>

            <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span className="text-[11px] font-medium text-muted">
                {current + 1}/{TOTAL}
              </span>
              <div className="flex items-center gap-1.5">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrent(i)}
                    aria-label={`Aller au slide ${i + 1}`}
                    className={cn(
                      "size-2 cursor-pointer rounded-full transition-all duration-200",
                      i === current
                        ? "scale-110 bg-purple"
                        : "border border-border bg-transparent hover:border-purple/40",
                    )}
                  />
                ))}
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="xs"
              onClick={goNext}
              className="shrink-0"
            >
              {isLast ? "C'est parti !" : "Suivant"}
              {!isLast && <ChevronRight className="size-3" />}
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
