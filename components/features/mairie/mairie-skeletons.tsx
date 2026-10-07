import { Card } from "@/components/ui/card";
import { PageStack } from "@/components/ui/page-stack";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

/** Skeleton mirroring the mairie dashboard while data loads. */
export function MairieDashboardSkeleton() {
  return (
    <PageStack>
      {/* Page heading */}
      <Skeleton className="h-8 w-48" />

      {/* Stats grid: 4 stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="space-y-2 p-5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-16" />
          </Card>
        ))}
      </div>

      {/* Outcome section: 3 cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[260px] rounded-lg" />
        ))}
      </div>

      {/* Weekly content chart */}
      <Card className="space-y-3 p-6">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-[280px] w-full rounded-sm" />
      </Card>

      {/* Weekly membership chart */}
      <Card className="space-y-3 p-6">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-[280px] w-full rounded-sm" />
      </Card>
    </PageStack>
  );
}

// ---------------------------------------------------------------------------
// Generic list page (annonces, initiatives, evenements)
// ---------------------------------------------------------------------------

/** Skeleton mirroring a mairie list page (annonces / initiatives / evenements). */
export function MairieListPageSkeleton({ cardCount = 5 }: { cardCount?: number }) {
  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-6">
        {/* Page heading */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>

        {/* Status filter buttons */}
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-20 rounded-sm" />
          <Skeleton className="h-8 w-20 rounded-sm" />
        </div>

        {/* Type filter buttons */}
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-20 rounded-sm" />
          <Skeleton className="h-8 w-24 rounded-sm" />
          <Skeleton className="h-8 w-20 rounded-sm" />
        </div>

        {/* Count */}
        <Skeleton className="h-3 w-40" />
      </Card>

      {/* List items */}
      <div className="space-y-2">
        {Array.from({ length: cardCount }).map((_, i) => (
          <Card key={i} className="space-y-2 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-32" />
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-28 rounded-sm" />
        <Skeleton className="h-9 w-28 rounded-sm" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail page (annonces/[id], initiatives/[id])
// ---------------------------------------------------------------------------

/** Skeleton mirroring a mairie content detail page. */
export function MairieDetailSkeleton() {
  return (
    <PageStack gap="5">
      {/* Back link */}
      <Skeleton className="h-5 w-44" />

      {/* Content card */}
      <Card className="space-y-4 p-6 lg:max-w-3xl">
        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        {/* Title */}
        <Skeleton className="h-8 w-3/4" />

        {/* Author */}
        <Skeleton className="h-4 w-48" />

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Image */}
        <Skeleton className="aspect-[16/10] w-full rounded-2xl" />

        {/* Date */}
        <Skeleton className="h-3 w-40" />
      </Card>
    </PageStack>
  );
}

// ---------------------------------------------------------------------------
// Habitants page
// ---------------------------------------------------------------------------

/** Skeleton mirroring the mairie habitants page while data loads. */
export function MairieHabitantsSkeleton({ cardCount = 6 }: { cardCount?: number }) {
  return (
    <PageStack>
      {/* Page heading */}
      <Skeleton className="h-8 w-40" />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/60 pb-2">
        <Skeleton className="h-9 w-28 rounded-sm" />
        <Skeleton className="h-9 w-28 rounded-sm" />
      </div>

      {/* Toolbar: search + filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Skeleton className="h-10 w-full max-w-md rounded-sm" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-sm" />
          <Skeleton className="h-9 w-28 rounded-sm" />
        </div>
      </div>

      {/* Count */}
      <Skeleton className="h-4 w-32" />

      {/* Member cards */}
      <div className="space-y-2">
        {Array.from({ length: cardCount }).map((_, i) => (
          <Card key={i} className="flex items-center gap-3 p-4">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3 w-56 max-w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-28 rounded-sm" />
        <Skeleton className="h-9 w-28 rounded-sm" />
      </div>
    </PageStack>
  );
}

// ---------------------------------------------------------------------------
// Signalements page
// ---------------------------------------------------------------------------

/** Skeleton mirroring the mairie signalements page while data loads. */
export function MairieSignalementsSkeleton({ cardCount = 4 }: { cardCount?: number }) {
  return (
    <PageStack>
      {/* Page heading */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Toolbar: search + filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Skeleton className="h-10 w-full max-w-md rounded-sm" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-sm" />
          <Skeleton className="h-9 w-24 rounded-sm" />
          <Skeleton className="h-9 w-24 rounded-sm" />
        </div>
      </div>

      {/* Count */}
      <Skeleton className="h-4 w-36" />

      {/* Report cards */}
      <div className="space-y-3">
        {Array.from({ length: cardCount }).map((_, i) => (
          <Card key={i} className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-24 rounded-sm" />
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-28 rounded-sm" />
        <Skeleton className="h-9 w-28 rounded-sm" />
      </div>
    </PageStack>
  );
}
