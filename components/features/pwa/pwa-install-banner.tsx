"use client";

import { useCallback, useState } from "react";
import { ChevronRight, Smartphone } from "lucide-react";
import { PwaInstallModal } from "./pwa-install-modal";
import { usePwaInstallPrompt } from "./use-pwa-install-prompt";

type Props = {
  hasSeenOnboarding: boolean;
};

export function PwaInstallBanner({ hasSeenOnboarding }: Props) {
  const { shouldShow, isReady, platform, dismiss } = usePwaInstallPrompt();
  const [modalOpen, setModalOpen] = useState(false);

  const handleClose = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    dismiss();
    setModalOpen(false);
  }, [dismiss]);

  if (!isReady || !hasSeenOnboarding || !shouldShow) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="md:hidden -mx-5 -mt-4 mb-4 flex w-[calc(100%+2.5rem)] cursor-pointer items-center gap-3 border-b border-border/60 bg-soft-pink px-5 py-3 text-left transition-opacity hover:opacity-95"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-purple/10">
          <Smartphone className="size-4 text-purple" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-5 text-text">
            Gardez Tous Voisins à portée de main
          </span>
          <span className="block text-xs font-medium leading-4 text-muted">
            Épinglez l&apos;application sur votre écran d&apos;accueil
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-subtle" aria-hidden />
      </button>

      <PwaInstallModal
        open={modalOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        platform={platform}
      />
    </>
  );
}
