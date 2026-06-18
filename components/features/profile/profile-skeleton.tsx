import { Card } from "@/components/ui/card";
import { PageStack } from "@/components/ui/page-stack";
import { cn } from "@/lib/utils/cn";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-warm", className)} />;
}

export function ProfileSkeleton() {
  return (
    <PageStack gap="5">
      <Card className="overflow-hidden rounded-xl p-0">
        <div className="grid gap-4 p-5 md:grid-cols-[auto_1fr] md:gap-5 md:p-6">
          <SkeletonBlock className="size-28 shrink-0 rounded-full border-4 border-surface md:row-span-2" />
          <div className="flex items-center justify-between gap-3">
            <SkeletonBlock className="h-7 w-44" />
            <SkeletonBlock className="h-8 w-36 shrink-0 rounded-sm" />
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-56" />
              <SkeletonBlock className="h-4 w-40" />
            </div>
            <div className="grid shrink-0 grid-cols-3 gap-3 md:w-80">
              <SkeletonBlock className="h-16" />
              <SkeletonBlock className="h-16" />
              <SkeletonBlock className="h-16" />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex gap-6 overflow-hidden border-b border-border pb-3 md:gap-8">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-5 w-24 shrink-0" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <SkeletonBlock className="h-7 w-48" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <Card className="space-y-3 p-5">
            <SkeletonBlock className="h-5 w-40" />
            <SkeletonBlock className="h-20 w-full" />
          </Card>
          <Card className="space-y-3 p-5">
            <SkeletonBlock className="h-5 w-44" />
            <SkeletonBlock className="h-32 w-full rounded-2xl" />
            <SkeletonBlock className="h-11 w-full rounded-sm" />
          </Card>
        </div>
      </div>
    </PageStack>
  );
}
