import { Card } from "@/components/ui/card";
import { PageStack } from "@/components/ui/page-stack";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageStack gap="5">
      <Skeleton className="h-5 w-44" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="space-y-4 p-6 lg:col-span-2">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
              <Skeleton className="h-8 w-72 max-w-full" />
              <Skeleton className="h-4 w-60 max-w-full" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </header>

          <Skeleton className="aspect-video w-full rounded-2xl" />

          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <Skeleton className="h-12 w-full rounded-2xl" />
        </Card>

        <aside className="space-y-4">
          <Card className="space-y-3 p-5">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </Card>
        </aside>
      </div>
    </PageStack>
  );
}
