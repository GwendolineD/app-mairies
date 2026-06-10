import { cn } from "@/lib/utils/cn";

type Props = {
  className?: string;
};

/** Neutral shimmer block used as a loading placeholder while data streams in. */
export function Skeleton({ className }: Props) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-warm", className)}
      aria-hidden
    />
  );
}
