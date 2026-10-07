import { Card } from "@/components/ui/card";
import { ListGrid, PageStack } from "@/components/ui/page-stack";
import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton mirroring the evenements list page while data loads. */
export function EvenementsListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <PageStack gap="4">
      {/* Page heading */}
      <header className="flex flex-wrap items-start justify-between gap-3 md:items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-32 rounded-sm" />
      </header>

      {/* Toolbar: category chips + view toggle */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-20 rounded-sm" />
          <Skeleton className="h-9 w-28 rounded-sm" />
          <Skeleton className="h-9 w-24 rounded-sm" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-sm" />
          <Skeleton className="h-9 w-9 rounded-sm" />
        </div>
      </div>

      {/* Count + sort */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-32 rounded-sm" />
      </div>

      {/* Card grid */}
      <ListGrid>
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="flex h-full flex-col gap-3 p-4">
            <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </Card>
        ))}
      </ListGrid>
    </PageStack>
  );
}
