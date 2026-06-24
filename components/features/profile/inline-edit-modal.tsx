"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  formId: string;
  description?: string;
  isSubmitting?: boolean;
  canSubmit?: boolean;
  children: React.ReactNode;
};

export function InlineEditModal({
  open,
  onClose,
  title,
  formId,
  description,
  isSubmitting = false,
  canSubmit = false,
  children,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      showCloseButton
      size="sm"
      description={description}
      closeDisabled={isSubmitting}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            form={formId}
            size="sm"
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Enregistrer
          </Button>
        </div>
      }
    >
      {children}
    </Modal>
  );
}
