import { Card } from "@/components/ui/card";
import { PageStack } from "@/components/ui/page-stack";
import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton mirroring the event detail layout while data loads. */
export function EventDetailSkeleton() {
  return (
    <PageStack gap="5">
      <Skeleton className="h-4 w-40" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card className="space-y-4 p-6">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="aspect-[16/10] w-full rounded-lg" />
            <div className="space-y-2 rounded-md border border-border/60 p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </Card>
        </div>
        <div className="space-y-5">
          <Card className="space-y-3 p-6">
            <Skeleton className="h-4 w-32" />
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-10 w-full rounded-sm" />
            <Skeleton className="h-10 w-full rounded-sm" />
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
