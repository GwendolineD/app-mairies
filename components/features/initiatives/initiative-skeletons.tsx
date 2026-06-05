import { Card } from "@/components/ui/card";
import { ListGrid, PageStack } from "@/components/ui/page-stack";
import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton mirroring the initiatives list while data loads. */
export function InitiativesListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <PageStack>
      <header className="flex flex-wrap items-start justify-between gap-3 md:items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-28 rounded-sm" />
      </header>
      <ListGrid>
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="flex h-full flex-col gap-3 p-5">
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

/** Skeleton mirroring the initiative detail layout while data loads. */
export function InitiativeDetailSkeleton() {
  return (
    <PageStack gap="5">
      <Skeleton className="h-4 w-40" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card className="space-y-4 p-6">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </Card>
        </div>
        <div className="space-y-5">
          <Card className="space-y-3 p-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-sm" />
            <Skeleton className="h-12 w-full" />
          </Card>
          <Card className="space-y-3 p-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          </Card>
        </div>
      </div>
    </PageStack>
  );
}
