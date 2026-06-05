import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AnnouncementMainSkeleton() {
  return (
    <Card className="space-y-5 p-6">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-8 w-3/4" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </Card>
  );
}

export function AnnouncementContactSkeleton() {
  return (
    <Card className="space-y-4 p-6">
      <Skeleton className="h-4 w-20" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
      <Skeleton className="h-11 w-full rounded-md" />
      <Skeleton className="h-10 w-full rounded-sm" />
    </Card>
  );
}

export function AnnouncementLocationSkeleton() {
  return (
    <Card className="space-y-4 p-6">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-44 w-full rounded-2xl" />
    </Card>
  );
}

export function SimilarAnnouncementsSkeleton() {
  return (
    <Card className="space-y-4 p-6">
      <Skeleton className="h-4 w-36" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-14 w-14 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </Card>
  );
}
