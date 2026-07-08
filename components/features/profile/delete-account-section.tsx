"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeleteAccountModal } from "@/components/features/profile/delete-account-modal";

type Props = {
  isPlatformAdmin: boolean;
  hasPassword: boolean;
  staffWarning?: string | null;
};

export function DeleteAccountSection({
  isPlatformAdmin,
  hasPassword,
  staffWarning,
}: Props) {
  const [open, setOpen] = useState(false);

  if (isPlatformAdmin) {
    return null;
  }

  return (
    <>
      <Card className="mt-6 space-y-4 rounded-none border-0 border-t border-border p-0 pt-6 shadow-none md:rounded-3xl md:border md:border-border/60 md:p-5 md:shadow-card">
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-coral">Zone danger</h3>
          <p className="text-sm font-medium leading-5 text-muted">
            La suppression de votre compte est irréversible. Toutes vos annonces,
            initiatives, événements et participations seront définitivement
            supprimés.
          </p>
          {staffWarning ? (
            <p className="text-sm font-semibold text-orange">{staffWarning}</p>
          ) : null}
        </div>

        <Button
          type="button"
          variant="danger"
          onClick={() => setOpen(true)}
        >
          Supprimer mon compte
        </Button>
      </Card>

      <DeleteAccountModal
        open={open}
        onClose={() => setOpen(false)}
        hasPassword={hasPassword}
        staffWarning={staffWarning}
      />
    </>
  );
}
