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
<<<<<<< HEAD
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
=======
    <PageStack gap="5" className="pb-28 md:pb-0">
      <Skeleton className="h-5 w-44" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        {/* Main card skeleton */}
        <Card className="space-y-5 p-6">
          <header className="space-y-3">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-8 w-72 max-w-full" />
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-60" />
            </div>
          </header>

          <div className="grid gap-5 md:grid-cols-[1fr_min(260px,40%)]">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          </div>
        </Card>

        {/* Sidebar skeleton */}
        <aside className="space-y-4">
          {/* Contact card */}
          <Card className="space-y-4 p-5">
            <Skeleton className="h-6 w-24" />
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-11 w-full rounded-sm" />
          </Card>

          {/* Location card */}
          <Card className="space-y-3 p-5">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </Card>

          {/* Similar announcements */}
          <Card className="space-y-3 p-5">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-16 w-20 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
>>>>>>> preprod
        </aside>
      </div>
    </PageStack>
  );
}
