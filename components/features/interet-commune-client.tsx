"use client";

import { useActionState, useState } from "react";
import { BanAutocomplete } from "@/components/features/ban-autocomplete";
import type { BanFeature } from "@/lib/ban/client";
import { searchMunicipalities } from "@/lib/ban/client";
import { submitCommuneInterest } from "@/lib/actions/auth";
import { AssetPlaceholder } from "@/components/ui/asset-placeholder";
import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea } from "@/components/ui/form-field";

export function InteretCommuneClient() {
  const [feature, setFeature] = useState<BanFeature | null>(null);
  const [state, action] = useActionState(
    async (
      _prev: Awaited<ReturnType<typeof submitCommuneInterest>> | undefined,
      fd: FormData,
    ) => submitCommuneInterest(fd),
    undefined,
  );

  return (
    <div className="space-y-4">
      <BanAutocomplete
        label="Commune (source Base Adresse Nationale)"
        placeholder="Commencez à taper votre commune..."
        fetchSuggestions={(q) => searchMunicipalities(q)}
        onSelect={setFeature}
      />
      {feature ? (
        <form action={action} className="space-y-3">
          <input type="hidden" name="inseeCode" value={feature.citycode} />
          <input type="hidden" name="city" value={feature.city} />
          <input type="hidden" name="label" value={feature.label} />
          <FormField label="E-mail pour être recontacté·e">
            <Input name="email" type="email" required />
          </FormField>
          <FormField label="Message (optionnel)">
            <Textarea name="message" rows={3} />
          </FormField>
          <Button type="submit" className="w-full py-3">
            Enregistrer mon intérêt
          </Button>
          {typeof state?.error === "string" ? (
            <p className="text-xs font-medium text-coral">{state.error}</p>
          ) : null}
          {state && "success" in state && state.success ? (
            <p className="text-xs font-medium text-mint">
              Merci ! Nous transmettons aux équipes concernées.
            </p>
          ) : null}
        </form>
      ) : (
        <AssetPlaceholder description="Choisissez une suggestion pour afficher la suite du formulaire" />
      )}
    </div>
  );
}
