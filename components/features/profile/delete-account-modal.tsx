"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMyAccount } from "@/lib/actions/account-deletion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { PasswordField } from "@/components/ui/password-field";

const CONFIRMATION_TEXT = "SUPPRIMER";

const modalFooterActionsClass =
  "flex flex-col-reverse gap-3 md:flex-row md:flex-wrap md:justify-end md:gap-2";

const modalFooterActionsStep1Class =
  "flex flex-wrap justify-end gap-3 md:gap-2";

const modalFooterButtonClass =
  "w-full min-w-0 shrink py-3 whitespace-normal md:w-auto md:shrink-0 md:py-1.5 md:whitespace-nowrap";

const modalFooterButtonTallClass = "py-3 md:py-1.5";

type Props = {
  open: boolean;
  onClose: () => void;
  hasPassword: boolean;
  staffWarning?: string | null;
};

export function DeleteAccountModal({
  open,
  onClose,
  hasPassword,
  staffWarning,
}: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [password, setPassword] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetState() {
    setStep(1);
    setPassword("");
    setConfirmationText("");
    setInlineError(null);
  }

  function handleClose() {
    if (isPending) return;
    resetState();
    onClose();
  }

  function handleContinue() {
    setInlineError(null);
    setStep(2);
  }

  function handleConfirm() {
    if (hasPassword && !password.trim()) {
      setInlineError("Merci de saisir votre mot de passe actuel.");
      return;
    }

    if (!hasPassword && confirmationText !== CONFIRMATION_TEXT) {
      setInlineError(`Tapez exactement « ${CONFIRMATION_TEXT} » pour confirmer.`);
      return;
    }

    startTransition(async () => {
      const result = await deleteMyAccount(hasPassword ? password : undefined);

      if (!result.success) {
        const message =
          result.error ??
          "Une erreur est survenue lors de la suppression du compte. Veuillez réessayer.";

        if (hasPassword && message.includes("mot de passe")) {
          setInlineError(message);
          return;
        }

        toast.error(message);
        return;
      }

      // Successful deletion redirects server-side; this line is unreachable.
    });
  }

  const canConfirm = hasPassword
    ? password.trim().length > 0
    : confirmationText === CONFIRMATION_TEXT;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={step === 1 ? "Supprimer votre compte ?" : "Confirmation irréversible"}
      closeDisabled={isPending}
    >
      {step === 1 ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-md bg-coral/10 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-coral" aria-hidden />
            <p className="text-sm font-medium leading-5 text-text">
              Cette action est définitive. Vous ne pourrez pas récupérer votre
              compte ni votre contenu.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-text">Ce qui sera supprimé</p>
            <ul className="list-disc space-y-1 pl-5 text-sm font-medium text-muted">
              <li>Vos annonces, initiatives et événements</li>
              <li>Vos participations et soutiens</li>
              <li>Vos données personnelles (nom, photo, adresse, e-mail)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-text">Ce qui sera conservé</p>
            <ul className="list-disc space-y-1 pl-5 text-sm font-medium text-muted">
              <li>
                Les conversations avec vos voisins (votre nom sera remplacé par
                « Ancien voisin »)
              </li>
            </ul>
          </div>

          {staffWarning ? (
            <div className="rounded-md bg-orange/10 px-4 py-3 text-sm font-semibold text-orange">
              {staffWarning}
            </div>
          ) : null}

          <div className={modalFooterActionsStep1Class}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={modalFooterButtonTallClass}
              disabled={isPending}
              onClick={handleClose}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className={modalFooterButtonTallClass}
              disabled={isPending}
              onClick={handleContinue}
            >
              J&apos;ai compris
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted">
            {hasPassword
              ? "Pour confirmer la suppression, saisissez votre mot de passe actuel."
              : `Pour confirmer la suppression, tapez « ${CONFIRMATION_TEXT} » ci-dessous.`}
          </p>

          {hasPassword ? (
            <PasswordField
              label="Mot de passe actuel"
              value={password}
              onValueChange={(value) => {
                setPassword(value);
                setInlineError(null);
              }}
              autoComplete="current-password"
              showValidation={false}
              placeholder="Votre mot de passe"
            />
          ) : (
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-text">Confirmation</span>
              <Input
                value={confirmationText}
                onChange={(event) => {
                  setConfirmationText(event.target.value);
                  setInlineError(null);
                }}
                placeholder={CONFIRMATION_TEXT}
                autoComplete="off"
              />
            </label>
          )}

          {inlineError ? (
            <p className="text-sm font-medium text-coral">{inlineError}</p>
          ) : null}

          <div className={modalFooterActionsClass}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={modalFooterButtonClass}
              disabled={isPending}
              onClick={handleClose}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              className={modalFooterButtonClass}
              disabled={isPending || !canConfirm}
              onClick={handleConfirm}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Suppression…
                </>
              ) : (
                "Supprimer définitivement mon compte"
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
