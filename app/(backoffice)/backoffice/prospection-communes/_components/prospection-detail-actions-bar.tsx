import { cn } from "@/lib/utils/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function ProspectionDetailActionsBar({ children, className }: Props) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center gap-2 border-t border-border bg-surface px-4 py-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
