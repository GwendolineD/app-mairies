"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleInitiativeSupport } from "@/lib/actions/initiatives";
import { Button } from "@/components/ui/button";
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

  return (
    <div className={cn("relative", hideCountInLabel && "space-y-3")}>
      {hideCountInLabel ? (
        <p className="text-base font-bold text-text">
          {count} soutien{count !== 1 ? "s" : ""}
        </p>
      ) : null}
      <Button
        type="button"
        variant={supported ? "primary" : "secondary"}
        onClick={handleToggle}
        disabled={isPending}
        className={cn(
          "gap-2",
          supported && "bg-mint/15 border-mint/40 text-mint hover:bg-mint/25",
          className,
        )}
      >
        <Heart
          className={cn("size-4", supported && "fill-mint")}
          aria-hidden
        />
        <span>
          {supported ? "Soutenu" : "Je soutiens"}
          {!hideCountInLabel && count > 0 ? ` (${count})` : ""}
        </span>
      </Button>

      {toastMessage ? (
        <div className="absolute -top-12 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-sm bg-text px-3 py-1.5 text-xs font-semibold text-white shadow-card animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
