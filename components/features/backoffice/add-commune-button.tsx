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
        className="font-semibold"
        onClick={() => setOpen(true)}
      >
        <Plus aria-hidden />
        Ajouter
      </Button>
      <AddCommuneModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
