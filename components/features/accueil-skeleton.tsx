import { Card } from "@/components/ui/card";
import { PageStack } from "@/components/ui/page-stack";
import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton mirroring the accueil page while data loads. */
export function AccueilSkeleton() {
  return (
    <PageStack gap="6">
      {/* Page header */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-80 max-w-full md:hidden" />
        </div>
      </header>

      {/* Hero section */}
      <Skeleton className="h-44 w-full rounded-2xl md:h-52" />

      {/* Outcome banner placeholder */}
      <Skeleton className="h-16 w-full rounded-xl" />

      {/* Hub grid: announcements + initiatives + events */}
      <div className="grid grid-cols-1 gap-6 max-md:gap-0 lg:grid-cols-2 lg:items-stretch">
        {/* Announcements hub */}
        <Card className="flex flex-col gap-4 max-md:rounded-none max-md:border-0 max-md:bg-background max-md:p-0 max-md:pb-6 max-md:shadow-none md:p-5 lg:col-start-1 lg:row-start-1 lg:h-full">
          <div className="space-y-1">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-60" />
          </div>
          <Skeleton className="h-9 w-36 rounded-sm" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </Card>

        {/* Initiatives hub */}
        <Card className="flex flex-col gap-4 max-md:rounded-none max-md:border-0 max-md:bg-background max-md:p-0 max-md:pb-6 max-md:shadow-none md:p-5 lg:col-start-1 lg:row-start-2">
          <div className="space-y-1">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-36 rounded-sm" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </Card>

        {/* Events hub */}
        <Card className="flex flex-col gap-4 max-md:rounded-none max-md:border-0 max-md:bg-background max-md:p-0 max-md:pb-6 max-md:shadow-none md:p-5 lg:col-start-2 lg:row-start-1 lg:h-full">
          <div className="space-y-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-9 w-36 rounded-sm" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 max-md:border-t max-md:border-border/60 max-md:pt-6">
        <Skeleton className="h-12 w-40 rounded-sm" />
        <Skeleton className="h-12 w-40 rounded-sm" />
        <Skeleton className="h-12 w-44 rounded-sm" />
      </div>
    </PageStack>
  );
}
