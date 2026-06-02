"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
  title: string;
  children: React.ReactNode;
  className?: string;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeDisabled?: boolean;
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
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !closeDisabled) onClose();
      }}
    >
      <DialogContent
        showCloseButton={showCloseButton}
        className={cn(
          "top-auto right-0 bottom-0 left-0 flex max-h-[90dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-t-3xl border-border/60 bg-surface p-0 shadow-elevated sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-1/2 sm:max-h-[min(90dvh,calc(100%-2rem))] sm:w-full sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl",
          SIZE_CLASS[size],
          className,
        )}
      >
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-4 text-left">
          <DialogTitle className="text-lg font-bold text-text">{title}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
