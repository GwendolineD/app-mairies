import { Suspense } from "react";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { BackLink } from "@/components/ui/back-link";
import { PageStack } from "@/components/ui/page-stack";
import { AnnouncementMain } from "./_components/announcement-main";
import { AnnouncementContact } from "./_components/announcement-contact";
import { AnnouncementLocation } from "./_components/announcement-location";
import { SimilarAnnouncements } from "./_components/similar-announcements";
import {
  AnnouncementContactSkeleton,
  AnnouncementLocationSkeleton,
  AnnouncementMainSkeleton,
  SimilarAnnouncementsSkeleton,
} from "./_components/skeletons";

export default async function AnnonceDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const ctx = await requireActiveMembership();
  const membership = ctx.activeMembership!;
  const communeId = membership.commune_id;
  const communeName = membership.commune?.name ?? "Votre commune";
  const fallbackLat = membership.commune?.centroid_lat ?? 46;
  const fallbackLng = membership.commune?.centroid_lng ?? 2.3;

  return (
    <PageStack gap="5">
      <BackLink href={ROUTES.annonces.list}>← Retour aux annonces</BackLink>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <Suspense fallback={<AnnouncementMainSkeleton />}>
            <AnnouncementMain id={id} communeId={communeId} />
          </Suspense>
        </div>
        <aside className="flex flex-col gap-5">
          <Suspense fallback={<AnnouncementContactSkeleton />}>
            <AnnouncementContact
              id={id}
              communeId={communeId}
              viewerMembershipId={membership.id}
            />
          </Suspense>
          <Suspense fallback={<AnnouncementLocationSkeleton />}>
            <AnnouncementLocation
              id={id}
              communeId={communeId}
              communeName={communeName}
              fallbackLat={fallbackLat}
              fallbackLng={fallbackLng}
            />
          </Suspense>
          <Suspense fallback={<SimilarAnnouncementsSkeleton />}>
            <SimilarAnnouncements id={id} communeId={communeId} />
          </Suspense>
        </aside>
      </div>
    </PageStack>
  );
}
