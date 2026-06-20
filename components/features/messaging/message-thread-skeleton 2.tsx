import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

export function MessageThreadSkeleton() {
  const bubbles = [
    { mine: false, width: "w-44" },
    { mine: true, width: "w-32" },
    { mine: false, width: "w-56" },
    { mine: true, width: "w-40" },
    { mine: false, width: "w-36" },
  ];

  return (
    <div className="flex h-[calc(100dvh-13rem)] min-h-[28rem] flex-col gap-3 md:h-[calc(100dvh-12rem)]">
      <Skeleton className="h-4 w-32" />
      <Card className="flex items-center gap-3 p-4">
        <Skeleton className="size-11 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
      </Card>
      <Card className="flex-1 space-y-3 p-4">
        {bubbles.map((bubble, index) => (
          <div
            key={index}
            className={cn("flex", bubble.mine ? "justify-end" : "justify-start")}
          >
            <Skeleton className={cn("h-9 rounded-2xl", bubble.width)} />
          </div>
        ))}
      </Card>
      <Card className="p-3">
        <Skeleton className="h-11 w-full rounded-sm" />
      </Card>
    </div>
  );
}
