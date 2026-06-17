// @ts-nocheck
"use client";

import { startTransition, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select } from "@/components/ui/form-field";
import { createCommune, updateCommune } from "@/lib/actions/platform";
import {
  COMMUNE_PLAN_LABEL,
  COMMUNE_PLAN_VALUES,
  SUBSCRIPTION_STATUS_LABEL,
  SUBSCRIPTION_STATUS_VALUES,
} from "@/lib/constants/statuses";
import type { CommuneOverviewRow } from "@/lib/types";

type ActionResult = { error?: string; success?: boolean };

type Props = {
  mode: "create" | "edit";
  commune?: CommuneOverviewRow;
};

export function CommuneForm({ mode, commune }: Props) {
  const action = mode === "create" ? createCommune : updateCommune;
  const [state, formAction, isPending] = useActionState<
    ActionResult,
    FormData
  >(action, {});

  const defaultAmount =
    commune && commune.monthly_amount_cents
      ? (commune.monthly_amount_cents / 100).toString()
      : "";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="space-y-4"
    >
      {mode === "edit" && commune ? (
        <input type="hidden" name="communeId" value={commune.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nom de la commune">
          <Input
            name="name"
            required
            defaultValue={commune?.name ?? ""}
            placeholder="Ex. Les Authieux"
          />
        </FormField>
        <FormField label="Code INSEE">
          <Input
            name="inseeCode"
            required
            defaultValue={commune?.insee_code ?? ""}
            placeholder="Ex. 27027"
          />
        </FormField>
        <FormField label="Code postal">
          <Input
            name="postcode"
            defaultValue={commune?.postcode ?? ""}
            placeholder="Ex. 27220"
          />
        </FormField>
        <FormField label="Département">
          <Input
            name="department"
            defaultValue={commune?.department ?? ""}
            placeholder="Ex. Eure"
          />
        </FormField>
        <FormField label="Formule (plan)">
          <Select name="plan" defaultValue={commune?.plan ?? "free"}>
            {COMMUNE_PLAN_VALUES.map((p) => (
              <option key={p} value={p}>
                {COMMUNE_PLAN_LABEL[p]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Statut d'abonnement">
          <Select
            name="subscriptionStatus"
            defaultValue={commune?.subscription_status ?? "trial"}
          >
            {SUBSCRIPTION_STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {SUBSCRIPTION_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Montant mensuel (€ / mois)">
          <Input
            name="monthlyAmount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={defaultAmount}
            placeholder="Ex. 49"
          />
        </FormField>
        <FormField label="Email de facturation">
          <Input
            name="billingEmail"
            type="email"
            defaultValue={commune?.billing_email ?? ""}
            placeholder="facturation@commune.fr"
          />
        </FormField>
      </div>

      {state?.error ? (
        <p
          className="rounded-md bg-soft-pink px-3 py-2 text-xs font-medium text-coral"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p
          className="rounded-md bg-mint/15 px-3 py-2 text-xs font-medium text-mint"
          role="status"
        >
          Modifications enregistrées.
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} className="px-6 py-3">
        {isPending
          ? "Enregistrement…"
          : mode === "create"
            ? "Créer le client"
            : "Enregistrer les modifications"}
      </Button>
    </form>
  );
}
