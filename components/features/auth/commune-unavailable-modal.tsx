"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-field";
import { submitCommuneInterest } from "@/lib/actions/auth";
import { APP_NAME } from "@/lib/constants/app";
import type { BanFeature } from "@/lib/ban/client";

type InterestState = { error?: string; success?: boolean };

type Props = {
  open: boolean;
  onClose: () => void;
  communeFeature: BanFeature | null;
  communeName?: string;
};

export function CommuneUnavailableModal({
  open,
  onClose,
  communeFeature,
  communeName,
}: Props) {
  const displayName = communeName ?? communeFeature?.city ?? "votre commune";

  const [state, action] = useActionState(
    async (_: InterestState | undefined, formData: FormData) =>
      submitCommuneInterest(formData),
    undefined as InterestState | undefined,
  );

  return (
    <Modal open={open} onClose={onClose} title="Commune pas encore disponible">
      <p className="text-sm leading-relaxed text-muted">
        «&nbsp;{displayName}&nbsp;» n&apos;a pas encore activé {APP_NAME} pour
        les habitant·es. Laissez votre e-mail : nous vous préviendrons dès que
        le service ouvre dans votre commune, et vos élu·es seront informé·es.
      </p>

      <form action={action} className="mt-4 flex flex-col gap-3">
        {communeFeature ? (
          <>
            <input type="hidden" name="inseeCode" value={communeFeature.citycode} />
            <input type="hidden" name="city" value={communeFeature.city} />
            <input type="hidden" name="label" value={communeFeature.label} />
          </>
        ) : null}

        <label className="text-sm font-medium text-text">
          E-mail pour être recontacté·e
          <Input
            name="email"
            type="email"
            required
            placeholder="vous@domaine.fr"
            className="mt-1"
          />
        </label>

        <label className="text-sm font-medium text-text">
          Message (optionnel)
          <textarea
            name="message"
            rows={2}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
          />
        </label>

        {state?.error ? (
          <p role="alert" className="text-xs font-medium text-coral">
            {state.error}
          </p>
        ) : null}
        {state?.success ? (
          <p className="text-xs font-medium text-mint">
            Merci&nbsp;! Nous avons bien enregistré votre intérêt.
          </p>
        ) : null}

        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <Button type="submit" className="flex-1 py-3">
            Enregistrer mon intérêt
          </Button>
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
