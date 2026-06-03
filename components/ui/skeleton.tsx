import { cn } from "@/lib/utils/cn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-warm", className)}
      {...props}
    />
  );
}

export { Skeleton };
