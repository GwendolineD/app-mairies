"use client";

import { useState } from "react";
import { JoinCommuneModal } from "@/components/features/join-commune-modal";
import { Button } from "@/components/ui/button";
import type { Membership } from "@/lib/types";

type Props = {
  memberships: Membership[];
};

export function ProfilAddCommuneButton({ memberships }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        Ajouter une commune
      </Button>
      <JoinCommuneModal
        open={open}
        onClose={() => setOpen(false)}
        existingMemberships={memberships}
      />
    </>
  );
}
