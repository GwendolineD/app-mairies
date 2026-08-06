"use client";

import { cn } from "@/lib/utils/cn";

type Props = {
  label: string;
  onClick: () => void;
  pending?: boolean;
  className?: string;
};

/** Discrete text link for incremental list loading (inbox, thread, participants). */
export function LoadMoreLink({ label, onClick, pending, className }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={cn(
        "cursor-pointer text-sm font-medium text-muted underline-offset-2 hover:text-purple hover:underline disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {pending ? "Chargement…" : label}
    </button>
  );
}
