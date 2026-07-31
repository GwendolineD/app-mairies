import { Card } from "@/components/ui/card";
import { PageStack } from "@/components/ui/page-stack";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

export function BackofficePageHeadingSkeleton({
  subtitle = true,
  actions = false,
}: {
  subtitle?: boolean;
  actions?: boolean;
}) {
  return (
    <header
      className={cn(
        actions && "flex flex-wrap items-start justify-between gap-3",
      )}
    >
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-8 w-64 max-w-full md:h-9 md:w-72" />
        {subtitle ? <Skeleton className="h-4 w-96 max-w-full" /> : null}
      </div>
      {actions ? <Skeleton className="h-9 w-28 shrink-0 rounded-sm" /> : null}
    </header>
  );
}

export function BackofficeBackLinkSkeleton() {
  return <Skeleton className="h-5 w-44" />;
}

export function BackofficeSearchBarSkeleton() {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <Skeleton className="h-10 w-full max-w-md rounded-sm" />
      <div className="hidden gap-2 md:flex">
        <Skeleton className="h-9 w-36 rounded-sm" />
        <Skeleton className="h-9 w-36 rounded-sm" />
      </div>
    </div>
  );
}

export function BackofficeListCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-5 w-48 max-w-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

export function BackofficeListPageSkeleton({
  cardCount = 4,
  showActions = false,
}: {
  cardCount?: number;
  showActions?: boolean;
}) {
  return (
    <PageStack>
      <BackofficePageHeadingSkeleton actions={showActions} />
      <BackofficeSearchBarSkeleton />
      <Skeleton className="h-4 w-28" />
      <div className="space-y-2">
        {Array.from({ length: cardCount }).map((_, index) => (
          <BackofficeListCardSkeleton key={index} />
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Skeleton className="h-9 w-28 rounded-sm" />
        <Skeleton className="h-9 w-32 rounded-sm" />
      </div>
    </PageStack>
  );
}

export function BackofficeStatsGridSkeleton({
  count = 2,
  cols = 2,
}: {
  count?: number;
  cols?: 2 | 3 | 4;
}) {
  const gridClass =
    cols === 4
      ? "grid grid-cols-2 gap-3 lg:grid-cols-4"
      : cols === 3
        ? "grid gap-3 sm:grid-cols-3"
        : "grid gap-3 sm:grid-cols-2";

  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="space-y-2 p-4 md:p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16 md:h-10" />
        </Card>
      ))}
    </div>
  );
}

export function BackofficeAuditCardSkeleton() {
  return (
    <Card className="gap-2 rounded-xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-4 w-40" />
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-24" />
      </div>
    </Card>
  );
}

export function BackofficeAuditListPageSkeleton() {
  return (
    <PageStack>
      <BackofficePageHeadingSkeleton />
      <BackofficeSearchBarSkeleton />
      <Skeleton className="h-4 w-28" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <BackofficeAuditCardSkeleton key={index} />
        ))}
      </div>
    </PageStack>
  );
}

export function BackofficeSignalementCardSkeleton() {
  return (
    <Card className="gap-3 rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-3 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <Skeleton className="h-9 w-40 rounded-sm" />
        <Skeleton className="h-3 w-44" />
      </div>
    </Card>
  );
}

export function BackofficeSignalementsPageSkeleton() {
  return (
    <PageStack>
      <BackofficePageHeadingSkeleton />
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-10 w-full max-w-md rounded-sm" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32 rounded-sm" />
            <Skeleton className="h-9 w-24 rounded-sm" />
          </div>
        </div>
        <Skeleton className="h-3 w-36" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <BackofficeSignalementCardSkeleton key={index} />
        ))}
      </div>
    </PageStack>
  );
}

export function BackofficeSimpleCardSkeleton() {
  return (
    <Card className="space-y-2 p-4">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-3 w-full max-w-sm" />
      <Skeleton className="h-16 w-full rounded-2xl" />
    </Card>
  );
}

export function BackofficeGridCardSkeleton() {
  return (
    <Card className="flex h-full flex-col rounded-xl p-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-auto h-3 w-20 self-end pt-3" />
    </Card>
  );
}

export function BackofficeCategoriesGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <PageStack>
      <BackofficePageHeadingSkeleton />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} className="space-y-3 p-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-9 w-24 rounded-sm" />
          </Card>
        ))}
      </div>
    </PageStack>
  );
}

export function BackofficeCommuneDetailSkeleton() {
  return (
    <PageStack>
      <BackofficeBackLinkSkeleton />
      <div className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Skeleton className="h-8 w-64 max-w-full" />
          <div className="flex gap-2">
            <Skeleton className="size-9 rounded-sm" />
            <Skeleton className="h-9 w-28 rounded-sm" />
          </div>
        </div>
        <div className="flex justify-between gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <BackofficeStatsGridSkeleton count={7} cols={4} />
      <div className="space-y-4">
        <div className="flex gap-1 border-b border-border pb-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Card className="space-y-4 p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-32 w-full rounded-sm" />
        </Card>
      </div>
    </PageStack>
  );
}

export function BackofficeUserDetailSkeleton() {
  return (
    <PageStack>
      <BackofficeBackLinkSkeleton />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-44 rounded-sm" />
          <Skeleton className="h-9 w-44 rounded-sm" />
        </div>
      </div>
      <BackofficeStatsGridSkeleton count={3} cols={3} />
      <section className="space-y-3">
        <Skeleton className="h-7 w-32" />
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="space-y-4 p-5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </Card>
        ))}
      </section>
    </PageStack>
  );
}

export function BackofficeEditorDetailSkeleton({
  showHeading = true,
}: {
  showHeading?: boolean;
}) {
  return (
    <PageStack>
      <BackofficeBackLinkSkeleton />
      {showHeading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-4 w-56" />
        </div>
      ) : null}
      <Card className="space-y-4 p-6">
        <Skeleton className="h-10 w-full rounded-sm" />
        <Skeleton className="h-105 w-full rounded-sm" />
        <div className="flex justify-end gap-2">
          <Skeleton className="h-9 w-24 rounded-sm" />
          <Skeleton className="h-9 w-32 rounded-sm" />
        </div>
      </Card>
    </PageStack>
  );
}

export function BackofficeSettingsPageSkeleton() {
  return (
    <PageStack>
      <BackofficePageHeadingSkeleton />
      <Card className="space-y-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-full max-w-md rounded-sm" />
        </div>
        <div className="space-y-3 border-t border-border pt-6">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <Skeleton className="h-9 w-32 rounded-sm" />
      </Card>
    </PageStack>
  );
}

export function BackofficeDashboardSkeleton() {
  return (
    <PageStack>
      <BackofficePageHeadingSkeleton subtitle={false} />
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <BackofficeStatsGridSkeleton count={2} cols={2} />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <BackofficeStatsGridSkeleton count={3} cols={3} />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <BackofficeStatsGridSkeleton count={2} cols={2} />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-36" />
          <BackofficeStatsGridSkeleton count={3} cols={3} />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-52" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="space-y-4 p-5">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-[320px] w-full rounded-sm" />
            </Card>
            <Card className="space-y-4 p-5">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-[320px] w-full rounded-sm" />
            </Card>
          </div>
        </div>
      </div>
    </PageStack>
  );
}
