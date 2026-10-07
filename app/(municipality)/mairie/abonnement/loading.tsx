import { Card } from "@/components/ui/card";
import { PageStack } from "@/components/ui/page-stack";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageStack>
      {/* Page heading */}
      <Skeleton className="h-8 w-40" />

      {/* Section heading */}
      <section className="space-y-4">
        <Skeleton className="h-6 w-52" />
        <Card className="space-y-4 p-6">
          {/* Table header */}
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          {/* Table rows */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 border-t border-border/40 pt-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </Card>
      </section>
    </PageStack>
  );
}
