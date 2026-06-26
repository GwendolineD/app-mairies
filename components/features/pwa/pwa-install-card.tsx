"use client";

import { useCallback, useState } from "react";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants/app";
import { PwaInstallModal } from "./pwa-install-modal";
import { usePwaInstallPrompt } from "./use-pwa-install-prompt";

export function PwaInstallCard() {
  const { showPermanent, isReady, platform, dismiss } = usePwaInstallPrompt();
  const [modalOpen, setModalOpen] = useState(false);

  const handleClose = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    dismiss();
    setModalOpen(false);
  }, [dismiss]);

  if (!isReady || !showPermanent) {
    return null;
  }

  return (
    <>
      <Card className="overflow-hidden rounded-xl p-0 md:hidden">
        <div className="space-y-4 p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-purple/10">
              <Smartphone className="size-5 text-purple" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-base font-semibold leading-6 text-text">
                Accédez à {APP_NAME} en un geste
              </p>
              <p className="text-xs font-medium leading-4 text-muted">
                Épinglez l&apos;application sur votre écran d&apos;accueil pour ne rien
                manquer de la vie de votre commune.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => setModalOpen(true)}
          >
            <Smartphone className="size-4" aria-hidden />
            Installer l&apos;application
          </Button>
        </div>
      </Card>

      <PwaInstallModal
        open={modalOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        platform={platform}
      />
    </>
  );
}
