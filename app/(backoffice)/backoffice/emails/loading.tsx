import {
  BackofficeGridCardSkeleton,
  BackofficePageHeadingSkeleton,
} from "@/components/features/backoffice/backoffice-skeletons";
import { PageStack } from "@/components/ui/page-stack";

export default function Loading() {
  return (
    <PageStack>
      <BackofficePageHeadingSkeleton />
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <BackofficeGridCardSkeleton key={index} />
        ))}
      </div>
    </PageStack>
  );
}
