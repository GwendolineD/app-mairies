"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { unsubscribeFromEmails } from "./actions";

export function UnsubscribeButton({ userId }: { userId: string }) {
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await unsubscribeFromEmails(userId);
      if (result.success) setDone(true);
    });
  }

  if (done) {
    return (
      <p className="text-sm font-medium text-mint">
        Vous avez été désinscrit·e avec succès.
      </p>
    );
  }

  return (
    <Button
      variant="primary"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? "Désinscription…" : "Désactiver les emails de suivi"}
    </Button>
  );
}
