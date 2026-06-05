import { Card } from "@/components/ui/card";
import { PageStack } from "@/components/ui/page-stack";
import { cn } from "@/lib/utils/cn";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-warm", className)} />;
}

export function ProfileSkeleton() {
  return (
    <PageStack gap="5">
      <Card className="overflow-hidden p-0">
        <div className="h-24 gradient-hero opacity-40" />
        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-end md:justify-between md:p-6">
          <div className="-mt-16 flex flex-col gap-3 md:flex-row md:items-end">
            <SkeletonBlock className="size-24 rounded-full border-4 border-surface" />
            <div className="space-y-2">
              <SkeletonBlock className="h-7 w-44" />
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-4 w-56" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 md:w-80">
            <SkeletonBlock className="h-16" />
            <SkeletonBlock className="h-16" />
            <SkeletonBlock className="h-16" />
          </div>
        </div>
      </Card>

      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-10 w-28 shrink-0 rounded-full" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
        <Card className="space-y-4 p-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <SkeletonBlock className="size-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-4 w-2/3" />
                <SkeletonBlock className="h-3 w-1/3" />
              </div>
              <SkeletonBlock className="h-12 w-16 rounded-xl" />
            </div>
          ))}
        </Card>
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
