"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteUserAccountByAdmin } from "@/lib/actions/account-deletion";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type Props = {
  userId: string;
  userName: string;
  userEmail: string | null;
  communeCount: number;
  contentCount: number;
  disabled?: boolean;
};

export function DeleteUserAccountButton({
  userId,
  userName,
  userEmail,
  communeCount,
  contentCount,
  disabled = false,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClose() {
    if (isPending) return;
    setOpen(false);
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteUserAccountByAdmin(userId);

      if (!result.success) {
        toast.error(
          result.error ??
            "Une erreur est survenue lors de la suppression du compte. Veuillez réessayer.",
        );
        return;
      }

      toast.success("Compte supprimé.");
      handleClose();
      router.push(ROUTES.backoffice.communes);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="danger"
        size="sm"
        disabled={disabled || isPending}
        onClick={() => setOpen(true)}
      >
        Supprimer le compte
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        title={`Supprimer le compte de ${userName} ?`}
        closeDisabled={isPending}
      >
        <div className="space-y-4">
          <div className="space-y-1 text-sm font-medium text-muted">
            {userEmail ? <p>E-mail : {userEmail}</p> : null}
            <p>
              {communeCount} commune{communeCount > 1 ? "s" : ""} · {contentCount}{" "}
              contenu{contentCount > 1 ? "s" : ""} publié{contentCount > 1 ? "s" : ""}
            </p>
          </div>

          <p className="text-sm font-medium leading-5 text-muted">
            Cette action est irréversible. Tout le contenu de cet utilisateur sera
            supprimé et son e-mail sera libéré.
          </p>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={handleClose}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={isPending}
              onClick={handleConfirm}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Suppression…
                </>
              ) : (
                "Confirmer la suppression"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
