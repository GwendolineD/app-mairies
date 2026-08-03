import {
  BackofficePageHeadingSkeleton,
  BackofficeSearchBarSkeleton,
  BackofficeSimpleCardSkeleton,
} from "@/components/features/backoffice/backoffice-skeletons";
import { PageStack } from "@/components/ui/page-stack";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageStack>
      <BackofficePageHeadingSkeleton subtitle={false} />
      <BackofficeSearchBarSkeleton />
      <Skeleton className="h-4 w-28" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <BackofficeSimpleCardSkeleton key={index} />
        ))}
      </div>
    </PageStack>
  );
}
