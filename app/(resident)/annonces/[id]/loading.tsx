import { BackLink } from "@/components/ui/back-link";
import { PageStack } from "@/components/ui/page-stack";
import { ROUTES } from "@/lib/constants/routes";
import {
  AnnouncementContactSkeleton,
  AnnouncementLocationSkeleton,
  AnnouncementMainSkeleton,
  SimilarAnnouncementsSkeleton,
} from "./_components/skeletons";

export default function Loading() {
  return (
    <PageStack gap="5">
      <BackLink href={ROUTES.annonces.list}>← Retour aux annonces</BackLink>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <AnnouncementMainSkeleton />
        </div>
        <aside className="flex flex-col gap-5">
          <AnnouncementContactSkeleton />
          <AnnouncementLocationSkeleton />
          <SimilarAnnouncementsSkeleton />
        </aside>
      </div>
    </PageStack>
  );
}
