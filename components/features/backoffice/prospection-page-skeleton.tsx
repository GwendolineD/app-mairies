import { Card } from "@/components/ui/card";
import { PageStack } from "@/components/ui/page-stack";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton mirroring the prospection-communes page while data loads.
 * Shows page heading with action button, toolbar with filters/view toggle,
 * and a list of prospect commune cards.
 */
export function ProspectionPageSkeleton({ cardCount = 8 }: { cardCount?: number }) {
  return (
    <PageStack>
      {/* Page heading with subtitle and action button */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-8 w-64 max-w-full md:h-9 md:w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36 shrink-0 rounded-sm" />
      </header>

      {/* Toolbar: search + filters + count + view toggle */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-2">
            <Skeleton className="h-10 w-full max-w-xs rounded-sm" />
            <Skeleton className="h-10 w-10 shrink-0 rounded-sm" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-sm" />
            <Skeleton className="h-9 w-9 rounded-sm" />
          </div>
        </div>
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Prospect commune cards */}
      <div className="space-y-2">
        {Array.from({ length: cardCount }).map((_, i) => (
          <Card key={i} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-8 w-20 shrink-0 rounded-sm" />
          </Card>
        ))}
      </div>
    </PageStack>
  );
}
