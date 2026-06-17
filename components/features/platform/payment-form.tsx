// @ts-nocheck
"use client";

import { startTransition, useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select } from "@/components/ui/form-field";
import { recordPayment } from "@/lib/actions/platform";
import {
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_VALUES,
} from "@/lib/constants/statuses";

type ActionResult = { error?: string; success?: boolean };

export function PaymentForm({
  communeId,
  defaultAmount,
}: {
  communeId: string;
  defaultAmount?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<
    ActionResult,
    FormData
  >(async (prev, fd) => {
    const result = await recordPayment(prev, fd);
    if (result.success) formRef.current?.reset();
    return result;
  }, {});

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="space-y-3"
    >
      <input type="hidden" name="communeId" value={communeId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Montant (€)">
          <Input
            name="amount"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={defaultAmount}
            placeholder="Ex. 49"
          />
        </FormField>
        <FormField label="Statut">
          <Select name="status" defaultValue="paid">
            {PAYMENT_STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {PAYMENT_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Début de période">
          <Input name="periodStart" type="date" />
        </FormField>
        <FormField label="Fin de période">
          <Input name="periodEnd" type="date" />
        </FormField>
      </div>
      <FormField label="Note (optionnel)">
        <Input name="note" placeholder="Ex. Abonnement mensuel mars" />
      </FormField>

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
          Paiement enregistré.
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} className="px-5 py-2.5">
        {isPending ? "Enregistrement…" : "Enregistrer le paiement"}
      </Button>
    </form>
  );
}
