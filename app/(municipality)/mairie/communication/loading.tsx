import { PageStack } from "@/components/ui/page-stack";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageStack>
      {/* Page heading */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Communication cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border/60 bg-surface p-5 shadow-card">
            <Skeleton className="aspect-[4/3] w-full rounded-lg" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-9 w-32 rounded-sm" />
          </div>
        ))}
      </div>
    </PageStack>
  );
}
