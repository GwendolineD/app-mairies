"use client";

import { useState, useTransition } from "react";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { SuspensionReasonTextarea } from "@/components/features/moderation/suspension-reason-textarea";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { validateSuspensionReason } from "@/lib/constants/moderation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils/cn";
import { suspendContent, suspendMembershipByStaff } from "@/lib/actions/moderation";
import { resolveReportAction } from "@/lib/actions/municipality";
import type { ConversationContextType } from "@/lib/types";

type Props = {
  reportId: string;
  contextType: string;
  contextId: string;
  authorMembershipId: string | null;
  authorName: string | null;
  isAuthorSelf: boolean;
  contentDeleted?: boolean;
};

const suspendButtonClassName =
  "border-coral bg-surface text-coral hover:bg-coral/5 hover:opacity-100";

export function ReportActionsClient({
  reportId,
  contextType,
  contextId,
  authorMembershipId,
  authorName,
  isAuthorSelf,
  contentDeleted = false,
}: Props) {
  const router = useRouter();
  const [busy, run] = useTransition();
  const [suspendContentOpen, setSuspendContentOpen] = useState(false);
  const [suspendAuthorOpen, setSuspendAuthorOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleCloseContentModal() {
    if (busy) return;
    setSuspendContentOpen(false);
    setReason("");
    setError(null);
  }

  function handleConfirmSuspendContent() {
    if (contextType === "user") return;

    const validationError = validateSuspensionReason(reason);
    if (validationError) {
      setError(validationError);
      return;
    }

    run(async () => {
      const result = await suspendContent(
        contextType as ConversationContextType,
        contextId,
        reason.trim(),
        reportId,
      );
      if (!result.success) {
        setError(result.error ?? "Impossible de suspendre le contenu.");
        return;
      }
      handleCloseContentModal();
      router.refresh();
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
    const validationError = validateSuspensionReason(reason);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!authorMembershipId) return;

    run(async () => {
      const result = await suspendMembershipByStaff(
        authorMembershipId,
        reason.trim(),
      );
      if (!result.success) {
        setError(result.error ?? "Impossible de suspendre l'auteur.");
        return;
      }
      handleCloseAuthorModal();
      router.refresh();
    });
  }

  const suspendAuthorDisabled = busy || isAuthorSelf;
  const canConfirmSuspension = validateSuspensionReason(reason) === null;

  const mobileActionButtonClass = "max-md:h-auto max-md:px-3 max-md:py-2";

  const suspendAuthorButton = (
    <Button
      type="button"
      variant="secondary"
      size="xs"
      className={cn(suspendButtonClassName, mobileActionButtonClass)}
      disabled={suspendAuthorDisabled}
      onClick={() => {
        setReason("");
        setError(null);
        setSuspendAuthorOpen(true);
      }}
    >
      Suspendre l&apos;auteur
    </Button>
  );

  return (
    <>
      <div className="flex flex-wrap gap-1.5 max-md:gap-x-3 max-md:gap-y-2.5">
        {contextType !== "user" && !contentDeleted && (
          <Button
            type="button"
            variant="secondary"
            size="xs"
            className={cn(suspendButtonClassName, mobileActionButtonClass)}
            disabled={busy}
            onClick={() => {
              setReason("");
              setError(null);
              setSuspendContentOpen(true);
            }}
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
          className={mobileActionButtonClass}
          disabled={busy}
          onClick={handleDismiss}
        >
          Ignorer
        </Button>
      </div>

      <Modal
        open={suspendContentOpen}
        onClose={handleCloseContentModal}
        title="Suspendre le contenu"
        closeDisabled={busy}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted">
              Ce contenu ne sera plus visible par les résident·es de la commune.
            </p>
            <p className="text-sm font-medium text-muted">
              L&apos;auteur·rice de ce contenu sera prévenu par email.
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-text">Raison</span>
            <div className="flex items-start gap-2.5 rounded-sm border border-purple/20 bg-soft-pink px-3 py-2.5">
              <Eye
                className="mt-0.5 size-4 shrink-0 text-purple"
                aria-hidden
              />
              <p className="text-sm font-medium text-text">
                Cette raison sera visible par l&apos;auteur·rice du contenu
                suspendu.
              </p>
            </div>
            <SuspensionReasonTextarea
              value={reason}
              onChange={(value) => {
                setReason(value);
                setError(null);
              }}
              rows={3}
              disabled={busy}
            />
          </label>

          {error ? <p className="text-sm font-medium text-coral">{error}</p> : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={handleCloseContentModal}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={busy || !canConfirmSuspension}
              onClick={handleConfirmSuspendContent}
            >
              Confirmer la suspension
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={suspendAuthorOpen}
        onClose={handleCloseAuthorModal}
        title={
          authorName
            ? `Suspendre l'auteur · ${authorName}`
            : "Suspendre l'auteur"
        }
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
            <div className="flex items-start gap-2.5 rounded-sm border border-purple/20 bg-soft-pink px-3 py-2.5">
              <Eye
                className="mt-0.5 size-4 shrink-0 text-purple"
                aria-hidden
              />
              <p className="text-sm font-medium text-text">
                Cette raison sera visible par l&apos;auteur·rice suspendu·e.
              </p>
            </div>
            <SuspensionReasonTextarea
              value={reason}
              onChange={(value) => {
                setReason(value);
                setError(null);
              }}
              rows={3}
              disabled={busy}
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
              disabled={busy || !canConfirmSuspension}
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
