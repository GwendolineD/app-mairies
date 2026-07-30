import {
  BackofficePageHeadingSkeleton,
  BackofficeSimpleCardSkeleton,
} from "@/components/features/backoffice/backoffice-skeletons";
import { PageStack } from "@/components/ui/page-stack";

export default function Loading() {
  return (
    <PageStack>
      <BackofficePageHeadingSkeleton />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <BackofficeSimpleCardSkeleton key={index} />
        ))}
      </div>
    </PageStack>
  );
}
