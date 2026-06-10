import { cn } from "@/lib/utils/cn";

/**
 * Neutral loading placeholder. Use inside `loading.tsx` / Suspense fallbacks to
 * render the page shell instantly while data streams in.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-warm", className)}
      aria-hidden
    />
  );
}
