import { cn } from "@/lib/utils/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
  gap?: "4" | "5" | "6";
};

const gapClass = {
  "4": "gap-4",
  "5": "gap-5",
  "6": "gap-6",
} as const;

/** Vertical page layout — padding comes from `app/(resident)/layout.tsx` main. */
export function PageStack({ children, className, gap = "6" }: Props) {
  return (
    <div className={cn("flex flex-col", gapClass[gap], className)}>{children}</div>
  );
}

/** Responsive card grid for list pages (1 → 2 → 3 columns). */
export function ListGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
