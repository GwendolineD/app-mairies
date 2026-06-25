"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/form-field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { suspendContent, suspendMembershipByStaff } from "@/lib/actions/moderation";
import { resolveReportAction } from "@/lib/actions/municipality";
import type { ConversationContextType } from "@/lib/types";

type Props = {
  reportId: string;
  contextType: string;
  contextId: string;
  authorMembershipId: string | null;
  isAuthorSelf: boolean;
};

const suspendButtonClassName =
  "border-coral bg-surface text-coral hover:bg-coral/5 hover:opacity-100";

export function ReportActionsClient({
  reportId,
  contextType,
  contextId,
  authorMembershipId,
  isAuthorSelf,
}: Props) {
  const [busy, run] = useTransition();
  const [suspendAuthorOpen, setSuspendAuthorOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSuspendContent() {
    if (contextType === "user") return;
    run(async () => {
      await suspendContent(
        contextType as ConversationContextType,
        contextId,
        "Suspendu suite à un signalement",
        reportId,
      );
    });
  }

  function handleDismiss() {
    run(async () => {
      await resolveReportAction(reportId, "dismissed");
    });
  }

  function handleCloseAuthorModal() {
    if (busy) return;
    setSuspendAuthorOpen(false);
    setReason("");
    setError(null);
  }

  function handleConfirmSuspendAuthor() {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError("Merci d'indiquer une raison de suspension.");
      return;
    }
    if (!authorMembershipId) return;

    run(async () => {
      const result = await suspendMembershipByStaff(authorMembershipId, trimmedReason);
      if (!result.success) {
        setError(result.error ?? "Impossible de suspendre l'auteur.");
        return;
      }
      handleCloseAuthorModal();
    });
  }

  const suspendAuthorDisabled = busy || isAuthorSelf;

  const suspendAuthorButton = (
    <Button
      type="button"
      variant="secondary"
      size="xs"
      className={suspendButtonClassName}
      disabled={suspendAuthorDisabled}
      onClick={() => setSuspendAuthorOpen(true)}
    >
      Suspendre l&apos;auteur
    </Button>
  );

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {contextType !== "user" && (
          <Button
            type="button"
            variant="secondary"
            size="xs"
            className={suspendButtonClassName}
            disabled={busy}
            onClick={handleSuspendContent}
          >
            Suspendre le contenu
          </Button>
        )}
        {authorMembershipId && contextType !== "user" ? (
          isAuthorSelf ? (
            <Popover>
              <PopoverTrigger
                openOnHover
                delay={200}
                closeDelay={100}
                nativeButton={false}
                render={
                  <span className="inline-flex cursor-not-allowed">
                    {suspendAuthorButton}
                  </span>
                }
              />
              <PopoverContent
                side="left"
                className="max-w-xs text-xs font-medium leading-4 text-muted"
              >
                Vous ne pouvez pas suspendre votre propre compte.
              </PopoverContent>
            </Popover>
          ) : (
            suspendAuthorButton
          )
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="xs"
          disabled={busy}
          onClick={handleDismiss}
        >
          Ignorer
        </Button>
      </div>

      <Modal
        open={suspendAuthorOpen}
        onClose={handleCloseAuthorModal}
        title="Suspendre l'auteur"
        closeDisabled={busy}
      >
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted">
            Cette action bloque l&apos;accès de l&apos;auteur·rice à la commune.
            Il ou elle sera redirigé·e vers la page de suspension lors de sa
            prochaine connexion.
          </p>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-text">Raison</span>
            <Textarea
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setError(null);
              }}
              placeholder="Expliquez brièvement la raison de la suspension."
              rows={3}
            />
          </label>

          {error ? <p className="text-sm font-medium text-coral">{error}</p> : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={handleCloseAuthorModal}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={busy}
              onClick={handleConfirmSuspendAuthor}
            >
              Confirmer la suspension
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
