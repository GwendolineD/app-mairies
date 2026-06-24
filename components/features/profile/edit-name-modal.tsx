"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateName } from "@/lib/actions/profile";
import { nameUpdateSchema } from "@/lib/validations/schemas";
import { FormField, Input } from "@/components/ui/form-field";
import { InlineEditModal } from "@/components/features/profile/inline-edit-modal";

type Props = {
  open: boolean;
  onClose: () => void;
  firstName: string | null;
  lastName: string | null;
};

export function EditNameModal({
  open,
  onClose,
  firstName,
  lastName,
}: Props) {
  const router = useRouter();
  const [first, setFirst] = useState(firstName ?? "");
  const [last, setLast] = useState(lastName ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setFirst(firstName ?? "");
    setLast(lastName ?? "");
  }, [open, firstName, lastName]);

  const canSubmit = useMemo(() => {
    const parsed = nameUpdateSchema.safeParse({
      firstName: first,
      lastName: last,
    });
    if (!parsed.success) return false;

    const initialFirst = (firstName ?? "").trim();
    const initialLast = (lastName ?? "").trim();
    return (
      parsed.data.firstName !== initialFirst ||
      parsed.data.lastName !== initialLast
    );
  }, [first, last, firstName, lastName]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const result = await updateName({ firstName: first, lastName: last });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Nom mis à jour !");
      router.refresh();
      onClose();
    });
  }

  return (
    <InlineEditModal
      open={open}
      onClose={onClose}
      title="Modifier mon nom"
      formId="edit-name-form"
      isSubmitting={isPending}
      canSubmit={canSubmit}
    >
      <form id="edit-name-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Prénom">
            <Input
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              required
              minLength={1}
              autoComplete="given-name"
            />
          </FormField>
          <FormField label="Nom">
            <Input
              value={last}
              onChange={(e) => setLast(e.target.value)}
              required
              minLength={1}
              autoComplete="family-name"
            />
          </FormField>
        </div>
      </form>
    </InlineEditModal>
  );
}
