"use client";

import { useState } from "react";

import {
  FilterSheet,
  FilterSheetTrigger,
} from "@/components/ui/filter-sheet";

type SheetState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export function useFilterSheetState(): SheetState {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}

type MobileSheetProps = {
  open: boolean;
  onClose: () => void;
  filterCount: number;
  totalResults?: number;
  onClearAll?: () => void;
  children: React.ReactNode;
};

export function FilterMobileSheetPanel({
  open,
  onClose,
  filterCount,
  totalResults,
  onClearAll,
  children,
}: MobileSheetProps) {
  return (
    <FilterSheet
      open={open}
      onClose={onClose}
      count={filterCount}
      totalResults={totalResults}
      onClearAll={onClearAll}
    >
      {children}
    </FilterSheet>
  );
}

export function FilterMobileTriggerButton({
  filterCount,
  onClick,
  className,
}: {
  filterCount: number;
  onClick: () => void;
  className?: string;
}) {
  return (
    <FilterSheetTrigger
      count={filterCount}
      iconOnly
      className={className}
      onClick={onClick}
    />
  );
}

export function FilterDesktopInline({ children }: { children: React.ReactNode }) {
  return (
    <div className="hidden md:flex md:flex-wrap md:items-center md:gap-2">
      {children}
    </div>
  );
}

type ResponsiveFilterBarProps = {
  filterCount: number;
  totalResults?: number;
  onClearAll?: () => void;
  children: React.ReactNode;
  /** Mobile sheet content — defaults to `children` when omitted. */
  mobileChildren?: React.ReactNode;
};

/**
 * Desktop: inline filter controls.
 * Mobile: use FilterMobileTriggerButton + FilterMobileSheetPanel separately
 * when the trigger must sit beside the search field.
 */
export function ResponsiveFilterBar({
  filterCount,
  totalResults,
  onClearAll,
  children,
  mobileChildren,
}: ResponsiveFilterBarProps) {
  const { open, setOpen } = useFilterSheetState();

  return (
    <>
      <FilterMobileTriggerButton
        filterCount={filterCount}
        onClick={() => setOpen(true)}
        className="md:hidden"
      />
      <FilterMobileSheetPanel
        open={open}
        onClose={() => setOpen(false)}
        filterCount={filterCount}
        totalResults={totalResults}
        onClearAll={
          onClearAll
            ? () => {
                onClearAll();
                setOpen(false);
              }
            : undefined
        }
      >
        {mobileChildren ?? children}
      </FilterMobileSheetPanel>
      <FilterDesktopInline>{children}</FilterDesktopInline>
    </>
  );
}
