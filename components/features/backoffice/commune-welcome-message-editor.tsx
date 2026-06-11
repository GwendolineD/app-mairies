"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { updateCommuneWelcomeMessageAsAdmin } from "@/lib/actions/platform";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/form-field";

type Props = {
  communeId: string;
  initialMessage: string;
};

export function CommuneWelcomeMessageEditor({
  communeId,
  initialMessage,
}: Props) {
  const router = useRouter();
  const [message, setMessage] = useState(initialMessage);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage]);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateCommuneWelcomeMessageAsAdmin(
        communeId,
        message,
      );
      if (!result.success) {
        setError(result.error ?? "Enregistrement impossible.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <FormField label="Message de bienvenue pour les nouveaux adhérent·es">
        <Textarea
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            setError(null);
          }}
          rows={5}
          placeholder="Un mot chaleureux de la mairie, en complément de la modale de bienvenue de l'app…"
          className="max-h-[calc(1.25rem*5+1.5rem)] resize-none overflow-y-auto"
        />
      </FormField>

      {error ? (
        <p className="text-sm font-medium text-coral" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        variant="secondary"
        disabled={isPending}
        onClick={handleSave}
      >
        Enregistrer le message
      </Button>
    </div>
  );
}
