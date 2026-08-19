"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteProspectCommuneAction } from "@/lib/actions/prospect-outreach";
import {
  buildProspectCommunesQuery,
  parseProspectCommunesParams,
} from "@/lib/prospect-communes/filter-params";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type Props = {
  prospectCommuneId: string;
  communeName: string;
  open: boolean;
  onClose: () => void;
};

export function DeleteProspectCommuneModal({
  prospectCommuneId,
  communeName,
  open,
  onClose,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listParams = useMemo(
    () =>
      parseProspectCommunesParams(
        Object.fromEntries(searchParams.entries()),
      ),
    [searchParams],
  );

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClose() {
    if (isPending) return;
    setError(null);
    onClose();
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteProspectCommuneAction(prospectCommuneId);
      if (!result.success) {
        setError(result.error);
        return;
      }

      onClose();
      toast.success("Commune supprimée.");
      router.replace(
        `${pathname}${buildProspectCommunesQuery({
          ...listParams,
          detailId: undefined,
        })}`,
      );
      router.refresh();
    });
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Supprimer la commune"
      size="md"
      closeDisabled={isPending}
      elevated
    >
      <div className="space-y-4">
        <p className="text-sm font-medium text-text">
          Cette action supprime la fiche{" "}
          <span className="font-semibold">{communeName}</span> et tout son suivi
          (statut, visites, notes, compteurs).
        </p>
        <p className="text-sm font-medium text-muted">
          Action irréversible. Les modifications non enregistrées seront perdues.
        </p>

        {error ? (
          <p className="text-sm font-medium text-coral" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="font-semibold"
            disabled={isPending}
            onClick={handleClose}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="font-semibold"
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? "Suppression…" : "Supprimer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
