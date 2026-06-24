"use client";

import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  onEdit: () => void;
  className?: string;
  children?: React.ReactNode;
};

export function ProfileEditableRow({
  label,
  onEdit,
  className,
  children,
}: Props) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className={cn(
        "group/editable inline-flex cursor-pointer items-start gap-1.5 text-left transition hover:text-text",
        className,
      )}
      aria-label={label}
    >
      <span className="min-w-0 flex-1">{children}</span>
      <Pencil
        className="mt-0.5 size-3.5 shrink-0 text-muted transition hover:text-purple md:opacity-0 md:group-hover/editable:opacity-100 md:transition-opacity"
        aria-hidden
      />
    </button>
  );
}
