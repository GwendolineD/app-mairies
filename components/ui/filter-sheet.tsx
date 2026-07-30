"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

// --- Trigger ---

type FilterSheetTriggerProps = {
  count: number;
  label?: string;
  className?: string;
  onClick: () => void;
  /** Icon-only square button (mobile toolbar placement next to search). */
  iconOnly?: boolean;
};

export function FilterSheetTrigger({
  count,
  label = "Filtres",
  className,
  onClick,
  iconOnly = false,
}: FilterSheetTriggerProps) {
  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={
          count > 0 ? `Filtres (${count} actifs)` : "Ouvrir les filtres"
        }
        className={cn(
          "relative inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-sm border bg-surface transition hover:border-purple/30",
          count > 0
            ? "border-purple/40 text-purple"
            : "border-border text-muted",
          className,
        )}
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        {count > 0 ? (
          <span className="absolute -top-1 -right-1 inline-flex size-4 items-center justify-center rounded-full bg-purple text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex cursor-pointer items-center gap-1.5 rounded-sm border bg-surface px-2.5 py-2.5 text-xs font-semibold transition hover:border-purple/30 md:py-1.5",
        count > 0
          ? "border-purple/40 text-purple"
          : "border-border text-muted",
        className,
      )}
    >
      <SlidersHorizontal className="size-3.5" aria-hidden />
      <span>{label}</span>
      {count > 0 ? (
        <span className="inline-flex size-4 items-center justify-center rounded-full bg-purple text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </button>
  );
}

// --- Sheet (Modal bottom-sheet on mobile) ---

type FilterSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  count?: number;
  onClearAll?: () => void;
  totalResults?: number;
  children: React.ReactNode;
};

export function FilterSheet({
  open,
  onClose,
  title = "Filtres",
  count = 0,
  onClearAll,
  totalResults,
  children,
}: FilterSheetProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      contentClassName="p-0"
      headerTrailing={
        onClearAll && count > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={onClearAll}>
            Tout effacer
          </Button>
        ) : null
      }
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="primary" size="sm" onClick={onClose}>
            {totalResults != null
              ? `Voir les ${totalResults} résultats`
              : "Fermer"}
          </Button>
        </div>
      }
    >
      <div className="max-h-[70vh] overflow-y-auto">{children}</div>
    </Modal>
  );
}

// --- FilterSection ---

type FilterSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <section className="border-b border-border py-2 last:border-0">
      <h3 className="px-4 pb-1 pt-2 text-[11px] font-bold uppercase tracking-widest text-muted">
        {title}
      </h3>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

// --- FilterRow ---

type FilterRowProps = {
  checked: boolean;
  onCheckboxToggle: () => void;
  onRowSelect: () => void;
  label: string;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  iconClassName?: string;
};

export function FilterRow({
  checked,
  onCheckboxToggle,
  onRowSelect,
  label,
  icon: Icon,
  iconClassName,
}: FilterRowProps) {
  return (
    <div className="flex w-full items-center gap-3 px-4 py-2 transition hover:bg-warm/60 md:py-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        onClick={(event) => {
          event.stopPropagation();
          onCheckboxToggle();
        }}
        className={cn(
          "inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm border-2 transition md:size-5",
          checked
            ? "border-purple bg-purple text-white"
            : "border-border bg-surface text-transparent hover:border-purple/40",
        )}
      >
        <CheckGlyph />
      </button>
      <button
        type="button"
        onClick={onRowSelect}
        className="flex min-h-10 flex-1 cursor-pointer items-center gap-2 text-left text-sm font-medium text-text md:min-h-0"
      >
        {Icon ? (
          <span
            className={cn(
              "inline-flex size-6 shrink-0 items-center justify-center rounded-full",
              iconClassName,
            )}
          >
            <Icon className="size-3.5" aria-hidden />
          </span>
        ) : null}
        <span className="flex-1 truncate">{label}</span>
      </button>
    </div>
  );
}

// --- CheckGlyph ---

export function CheckGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className="size-3.5 stroke-current"
      fill="none"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
    </svg>
  );
}
