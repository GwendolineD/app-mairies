"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useVisualViewportBottomSheet } from "@/lib/hooks/use-visual-viewport-bottom-sheet";
import { cn } from "@/lib/utils/cn";
import { XIcon } from "lucide-react";

type ModalSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

type Props = {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeDisabled?: boolean;
  /** Content rendered above the title in the header (eg. category tags). */
  headerPrefix?: React.ReactNode;
  /** Intro text between header and scrollable body. */
  description?: React.ReactNode;
  /** Fixed footer below the scrollable body (eg. modal actions). */
  footer?: React.ReactNode;
  /** Action aligned to the right of the header (eg. clear all filters). */
  headerTrailing?: React.ReactNode;
  /** Override padding/spacing on the scrollable body (eg. `p-0` for full-bleed content). */
  contentClassName?: string;
  /** When false, body does not scroll — use for full-viewport media (lightbox). */
  scrollable?: boolean;
  /** Render above side sheets / drawers (z-1300 vs default z-1100). */
  elevated?: boolean;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  size = "md",
  showCloseButton = false,
  closeDisabled = false,
  headerPrefix,
  description,
  footer,
  headerTrailing,
  contentClassName,
  scrollable = true,
  elevated = false,
}: Props) {
  const viewportStyle = useVisualViewportBottomSheet(open);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !closeDisabled) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        elevated={elevated}
        style={viewportStyle}
        className={cn(
          "top-auto inset-x-0 bottom-0 flex max-h-[90dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none rounded-t-3xl border-0 border-t border-border/60 bg-surface p-0 shadow-elevated ring-0 sm:top-1/2 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:max-h-[min(90dvh,calc(100%-2rem))] sm:w-full sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border sm:ring-1 sm:ring-foreground/10",
          SIZE_CLASS[size],
          className,
        )}
      >
        <DialogHeader className="flex shrink-0 flex-row items-start justify-between gap-3 border-b border-border/60 px-6 py-4 text-left">
          <div className="min-w-0 flex-1 space-y-2">
            {headerPrefix}
            <DialogTitle className="text-lg font-bold leading-snug text-text">{title}</DialogTitle>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerTrailing}
            {showCloseButton ? (
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 cursor-pointer text-muted hover:text-text"
                  disabled={closeDisabled}
                />
              }
            >
              <XIcon aria-hidden />
              <span className="sr-only">Fermer</span>
            </DialogClose>
            ) : null}
          </div>
        </DialogHeader>
        {description ? (
          <p className="flex shrink-0 items-center px-6 py-3 text-sm font-medium leading-5 text-muted">
            {description}
          </p>
        ) : null}
        <div
          className={cn(
            "min-h-0 flex-1 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4",
            scrollable ? "overflow-y-auto" : "overflow-hidden",
            contentClassName,
          )}
        >
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-border/60 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4">
            {footer}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
