"use client";

import { useState } from "react";

import { FilterSheetTrigger } from "@/components/ui/filter-sheet";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

type Props = {
  /** Number of active filters (shown as badge) */
  filterCount: number;
  /** Total result count for footer */
  totalResults?: number;
  /** Called when "clear all" is pressed */
  onClearAll?: () => void;
  /** The filter controls to render */
  children: React.ReactNode;
};

/**
 * On mobile (< md): shows a "Filtres (N)" trigger button that opens a bottom sheet.
 * On desktop (>= md): renders children inline.
 */
export function ResponsiveFilterBar({
  filterCount,
  totalResults,
  onClearAll,
  children,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile: trigger + sheet */}
      <div className="md:hidden">
        <FilterSheetTrigger
          count={filterCount}
          onClick={() => setOpen(true)}
        />
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Filtres"
          size="sm"
          scrollable
          footer={
            <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
              {onClearAll && filterCount > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onClearAll();
                    setOpen(false);
                  }}
                >
                  Tout effacer
                </Button>
              ) : (
                <span />
              )}
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setOpen(false)}
              >
                {totalResults != null
                  ? `Voir ${totalResults} résultat${totalResults !== 1 ? "s" : ""}`
                  : "Appliquer"}
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-4 p-4">{children}</div>
        </Modal>
      </div>

      {/* Desktop: inline */}
      <div className="hidden md:block">
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      </div>
    </>
  );
}
