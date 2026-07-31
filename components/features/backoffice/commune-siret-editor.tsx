"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { updateCommuneSiret } from "@/lib/actions/platform";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form-field";

const SIRET_LENGTH = 14;

type Props = {
  communeId: string;
  initialSiret: string;
};

function isValidSiret(value: string): boolean {
  return value === "" || /^\d{14}$/.test(value);
}

export function CommuneSiretEditor({ communeId, initialSiret }: Props) {
  const router = useRouter();
  const [siret, setSiret] = useState(initialSiret);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSiret(initialSiret);
  }, [initialSiret]);

  const hasChanges = siret !== initialSiret;
  const canSave = isValidSiret(siret);

  function handleSave() {
    setError(null);

    if (!isValidSiret(siret)) {
      setError("Le SIRET doit comporter exactement 14 chiffres.");
      return;
    }

    startTransition(async () => {
      const result = await updateCommuneSiret(communeId, siret);
      if (!result.success) {
        setError(result.error ?? "Enregistrement impossible.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <FormField label="Numéro SIRET de la commune">
        <Input
          value={siret}
          onChange={(event) => {
            const value = event.target.value.replace(/\D/g, "").slice(0, SIRET_LENGTH);
            setSiret(value);
            setError(null);
          }}
          inputMode="numeric"
          maxLength={SIRET_LENGTH}
          placeholder="00000000000000"
          aria-invalid={error ? true : undefined}
        />
      </FormField>

      {error ? (
        <p className="text-sm font-medium text-coral" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-muted">
          {siret.length}/{SIRET_LENGTH}
        </span>
        {hasChanges ? (
          <Button
            type="button"
            variant="secondary"
            size="xs"
            disabled={isPending || !canSave}
            onClick={handleSave}
          >
            Enregistrer
          </Button>
        ) : null}
      </div>
    </div>
  );
}
