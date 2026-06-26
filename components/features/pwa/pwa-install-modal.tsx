"use client";

import type { ReactNode } from "react";
import { MoreVertical, Share, Smartphone } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants/app";
import type { PwaPlatform } from "./use-pwa-install-prompt";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  platform: PwaPlatform;
};

type InstructionStep = {
  icon: ReactNode;
  text: string;
};

function getInstructions(platform: PwaPlatform): InstructionStep[] {
  if (platform === "ios") {
    return [
      {
        icon: <Share className="size-5 shrink-0 text-purple" aria-hidden />,
        text: "Appuyez sur Partager (icône carrée avec une flèche vers le haut).",
      },
      {
        icon: <Smartphone className="size-5 shrink-0 text-purple" aria-hidden />,
        text: "Choisissez « Sur l'écran d'accueil ».",
      },
      {
        icon: <Smartphone className="size-5 shrink-0 text-purple" aria-hidden />,
        text: "Appuyez sur « Ajouter » pour épingler l'application.",
      },
    ];
  }

  if (platform === "android") {
    return [
      {
        icon: <MoreVertical className="size-5 shrink-0 text-purple" aria-hidden />,
        text: "Appuyez sur le menu du navigateur (trois points en haut à droite).",
      },
      {
        icon: <Smartphone className="size-5 shrink-0 text-purple" aria-hidden />,
        text: "Sélectionnez « Ajouter à l'écran d'accueil » ou « Installer l'application ».",
      },
      {
        icon: <Smartphone className="size-5 shrink-0 text-purple" aria-hidden />,
        text: "Confirmez pour garder l'application à portée de main.",
      },
    ];
  }

  return [
    {
      icon: <Share className="size-5 shrink-0 text-purple" aria-hidden />,
      text: "Ouvrez le menu ou le bouton Partager de votre navigateur.",
    },
    {
      icon: <Smartphone className="size-5 shrink-0 text-purple" aria-hidden />,
      text: "Cherchez l'option « Ajouter à l'écran d'accueil » ou « Installer ».",
    },
    {
      icon: <Smartphone className="size-5 shrink-0 text-purple" aria-hidden />,
      text: "Validez pour accéder à l'application comme sur mobile.",
    },
  ];
}

export function PwaInstallModal({ open, onClose, onConfirm, platform }: Props) {
  const steps = getInstructions(platform);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Gardez ${APP_NAME} à portée de main`}
      description="Épinglez l'application sur votre écran d'accueil pour y accéder en un geste."
      footer={
        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="w-full sm:w-auto"
            onClick={onClose}
          >
            Plus tard
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full sm:w-auto"
            onClick={onConfirm}
          >
            C&apos;est fait !
          </Button>
        </div>
      }
    >
      <ol className="space-y-4">
        {steps.map((step, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-soft-pink text-sm font-semibold text-purple">
              {index + 1}
            </span>
            <div className="flex min-w-0 items-start gap-3 pt-0.5">
              {step.icon}
              <p className="text-sm font-medium leading-5 text-text">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </Modal>
  );
}
