"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { AddCommuneModal } from "@/components/features/backoffice/add-commune-modal";
import { Button } from "@/components/ui/button";

export function AddCommuneButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="primary"
        size="sm"
        className="font-semibold max-md:size-9 max-md:p-0 max-md:gap-0"
        aria-label="Ajouter une commune"
        onClick={() => setOpen(true)}
      >
        <Plus aria-hidden />
        <span className="hidden md:inline">Ajouter</span>
      </Button>
      <AddCommuneModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
