import { cn } from "@/lib/utils/cn";

/** Pulsing placeholder block used while data streams in. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-warm", className)}
      aria-hidden
    />
  );
}
