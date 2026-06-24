"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { requestEmailChange } from "@/lib/actions/auth";
import { emailChangeSchema } from "@/lib/validations/schemas";
import { InlineEditModal } from "@/components/features/profile/inline-edit-modal";
import { FormField, Input } from "@/components/ui/form-field";

type Props = {
  open: boolean;
  onClose: () => void;
  currentEmail: string | null;
};

export function EditEmailModal({ open, onClose, currentEmail }: Props) {
  const [email, setEmail] = useState(currentEmail ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setEmail(currentEmail ?? "");
  }, [open, currentEmail]);

  const canSubmit = useMemo(() => {
    const parsed = emailChangeSchema.safeParse({ email });
    if (!parsed.success) return false;
    return parsed.data.email.toLowerCase() !== (currentEmail ?? "").toLowerCase();
  }, [email, currentEmail]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const result = await requestEmailChange(email.trim());
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Un email de confirmation a été envoyé à ${email.trim()}. Cliquez sur le lien pour valider le changement.`,
      );
      onClose();
    });
  }

  return (
    <InlineEditModal
      open={open}
      onClose={onClose}
      title="Modifier mon email"
      formId="edit-email-form"
      description="Un email de confirmation sera envoyé à votre nouvelle adresse."
      isSubmitting={isPending}
      canSubmit={canSubmit}
    >
      <form id="edit-email-form" onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Adresse e-mail">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            required
          />
        </FormField>
      </form>
    </InlineEditModal>
  );
}
