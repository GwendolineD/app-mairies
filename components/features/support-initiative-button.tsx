"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleInitiativeSupport } from "@/lib/actions/initiatives";
import {
  ENGAGEMENT_ACTIVE_BUTTON_CLASS,
  ENGAGEMENT_ACTIVE_ICON_CLASS,
} from "@/components/features/engagement-button-styles";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { cn } from "@/lib/utils/cn";

type Props = {
  initiativeId: string;
  initialSupported: boolean;
  initialCount: number;
  /** When true, count is shown only via a separate label (not in the button). */
  hideCountInLabel?: boolean;
  className?: string;
};

export function SupportInitiativeButton({
  initiativeId,
  initialSupported,
  initialCount,
  hideCountInLabel = false,
  className,
}: Props) {
  const [supported, setSupported] = useState(initialSupported);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function handleToggle() {
    const nextSupported = !supported;
    setSupported(nextSupported);
    setCount((c) => (nextSupported ? c + 1 : Math.max(0, c - 1)));

    startTransition(async () => {
      const result = await toggleInitiativeSupport(initiativeId);
      if (result.error) {
        setSupported(!nextSupported);
        setCount((c) => (nextSupported ? Math.max(0, c - 1) : c + 1));
        return;
      }
      setToastMessage(
        result.supported
          ? "Votre soutien a été enregistré !"
          : "Soutien retiré",
      );
      setTimeout(() => setToastMessage(null), 3000);
    });
  }

  const label = isPending
    ? "Soutien…"
    : supported
      ? `Je soutiens${!hideCountInLabel && count > 0 ? ` (${count})` : ""}`
      : "Je veux soutenir";

  return (
    <div className="relative">
      {supported ? (
        <Button
          type="button"
          variant="secondary"
          onClick={handleToggle}
          disabled={isPending}
          className={cn(
            "w-full cursor-pointer",
            ENGAGEMENT_ACTIVE_BUTTON_CLASS,
            className,
          )}
        >
          <Heart className={cn("size-4", ENGAGEMENT_ACTIVE_ICON_CLASS)} aria-hidden />
          {label}
        </Button>
      ) : (
        <GradientButton
          type="button"
          gradient="hero"
          className={cn("w-full", className)}
          disabled={isPending}
          onClick={handleToggle}
        >
          <Heart className="size-4 text-white" aria-hidden />
          {label}
        </GradientButton>
      )}

      {toastMessage ? (
        <div className="absolute -top-12 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-sm bg-text px-3 py-1.5 text-xs font-semibold text-white shadow-card animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
