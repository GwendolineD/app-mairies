"use client";

import { useState } from "react";
import { DeleteProspectCommuneModal } from "@/components/features/backoffice/delete-prospect-commune-modal";
import { Button } from "@/components/ui/button";

type Props = {
  prospectCommuneId: string;
  communeName: string;
};

export function ProspectionDetailDeleteButton({
  prospectCommuneId,
  communeName,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="danger"
        size="sm"
        className="ml-auto cursor-pointer"
        onClick={() => setOpen(true)}
      >
        Supprimer
      </Button>
      <DeleteProspectCommuneModal
        prospectCommuneId={prospectCommuneId}
        communeName={communeName}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
