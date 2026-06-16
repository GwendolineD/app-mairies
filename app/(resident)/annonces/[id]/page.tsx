import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MapPin } from "lucide-react";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { listSimilarAnnouncements } from "@/lib/queries/announcements";
import type { AnnouncementWithAuthor } from "@/lib/queries/announcements";
import { createClient } from "@/lib/supabase/server";
import {
  getCategoryColorHex,
  getCategoryLabel,
} from "@/lib/constants/announcement-categories";
import { BackLink } from "@/components/ui/back-link";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  AnnouncementCard,
  TypePastille,
} from "@/components/features/announcement-card";
import { AnnouncementDetailMobileBar } from "@/components/features/announcement-detail-mobile-bar";
import { AnnouncementLocationMap } from "@/components/features/announcement-location-map";
import { AnnouncementSidebarActions } from "@/components/features/announcement-sidebar-actions";
import { ReportButton } from "@/components/features/report-button";
import { formatMemberSince, formatRelativeTime } from "@/lib/utils/date";
import type { AnnouncementEditData } from "@/lib/types";
import { PageStack } from "@/components/ui/page-stack";

const DETAIL_CARD_CLASS = "rounded-xl";
const DETAIL_TAG_CLASS = "rounded-sm px-2.5 py-0.5 text-xs";

export default async function AnnonceDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const { data } = await supabase
    .from("announcements")
    .select(
      `*, author_membership:memberships!announcements_author_membership_id_fkey(
        created_at,
        address_street,
        address_city,
        user_id,
        profiles:profiles!memberships_profiles_user_id_fkey(
          display_name, first_name, last_name, avatar_url
        )
      )`,
    )
    .eq("id", id)
    .eq("commune_id", ctx.activeMembership!.commune_id)
    .single();

  if (!data) notFound();

  type EnrichedAnnouncement = typeof data & {
    author_membership: {
      created_at: string;
      address_street: string | null;
      address_city: string | null;
      user_id: string;
      profiles: {
        display_name: string | null;
        first_name: string | null;
        last_name: string | null;
        avatar_url: string | null;
      } | null;
    } | null;
  };

  const ann = data as EnrichedAnnouncement;

  const authorProfile = ann.author_membership?.profiles;
  const authorName =
    (authorProfile?.display_name ??
      [authorProfile?.first_name, authorProfile?.last_name].filter(Boolean).join(" ")) ||
    "Voisin·e";
  const authorAvatarUrl = authorProfile?.avatar_url ?? null;
  const memberSince = ann.author_membership?.created_at
    ? formatMemberSince(ann.author_membership.created_at)
    : "Membre";

  const authorLocation =
    ann.author_membership?.address_street ??
    ann.author_membership?.address_city ??
    "Adresse non renseignée";

  const isAuthor = ann.author_membership?.user_id === ctx.userId;
  const contactLabel =
    ann.type === "demande" ? "Je peux aider !" : `Contacter ${authorName.split(" ")[0]}`;

  const editData: AnnouncementEditData = {
    type: ann.type,
    categorySlug: ann.category_slug,
    title: ann.title,
    description: ann.description ?? "",
    targetDate: ann.target_date ?? "",
    photoUrl: ann.photo_url ?? "",
    addressStreet: ann.address_street ?? "",
    addressCity: ann.address_city ?? "",
    addressCitycode: ann.address_citycode ?? "",
    addressPostcode: ann.address_postcode ?? "",
    addressLat: ann.address_lat ?? 0,
    addressLng: ann.address_lng ?? 0,
  };

  return (
    <PageStack gap="5" className="pb-28 md:pb-0">
      <BackLink href={ROUTES.annonces.list}>Retour aux annonces</BackLink>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        {/* --- Main card --- */}
        <Card className={`space-y-5 p-6 ${DETAIL_CARD_CLASS}`}>
          <div className="grid gap-5 md:grid-cols-[1fr_min(260px,40%)]">
            <div className="space-y-5">
              <header className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <TypePastille type={ann.type} className="shadow-none" />
                  <CategoryTag
                    label={getCategoryLabel(ann.category_slug)}
                    colorHex={getCategoryColorHex(ann.category_slug)}
                    className={DETAIL_TAG_CLASS}
                  />
                </div>
                <h1 className="text-[28px] font-bold leading-9 text-text">{ann.title}</h1>

                <div className="flex items-center gap-3">
                  <UserAvatar name={authorName} url={authorAvatarUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text">{authorName}</p>
                    <p className="text-sm text-muted">{formatRelativeTime(ann.created_at)}</p>
                  </div>
                </div>
              </header>

              {ann.description ? (
                <p className="scrollbar-hover max-h-64 overflow-y-auto whitespace-pre-line text-base font-medium leading-6 text-muted">
                  {ann.description}
                </p>
              ) : (
                <p className="text-base font-medium italic text-muted">
                  Pas de détail complémentaire.
                </p>
              )}

              <ReportButton contextType="announcement" contextId={ann.id} />
            </div>

            {ann.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ann.photo_url}
                alt=""
                className="h-fit w-full rounded-lg border border-border object-cover"
              />
            ) : null}
          </div>
        </Card>

        {/* --- Sidebar --- */}
        <aside className="space-y-4">
          <AnnouncementSidebarActions
            isAuthor={isAuthor}
            announcementId={ann.id}
            authorName={authorName}
            authorAvatarUrl={authorAvatarUrl}
            memberSince={memberSince}
            contactLabel={contactLabel}
            editData={editData}
            className={DETAIL_CARD_CLASS}
          />

          {/* Location card */}
          <Card className={`space-y-3 p-5 ${DETAIL_CARD_CLASS}`}>
            <h2 className="text-lg font-semibold text-text">Localisation</h2>
            {ann.address_lat != null && ann.address_lng != null ? (
              <AnnouncementLocationMap
                latitude={ann.address_lat}
                longitude={ann.address_lng}
                announcementTitle={ann.title}
                addressLabel={authorLocation}
              />
            ) : (
              <p className="inline-flex items-center gap-1.5 text-sm text-muted">
                <MapPin className="size-3.5 shrink-0 text-subtle" aria-hidden />
                {authorLocation}
              </p>
            )}
          </Card>

          {/* Similar announcements */}
          <Suspense fallback={<SimilarAnnouncementsSkeleton />}>
            <SimilarAnnouncements
              communeId={ctx.activeMembership!.commune_id}
              categorySlug={ann.category_slug}
              excludeId={ann.id}
            />
          </Suspense>
        </aside>
      </div>

      {/* Mobile sticky bar */}
      <AnnouncementDetailMobileBar
        isAuthor={isAuthor}
        announcementId={ann.id}
        addressCity={ann.address_city}
        contactLabel={contactLabel}
        editData={editData}
      />
    </PageStack>
  );
}

async function SimilarAnnouncements({
  communeId,
  categorySlug,
  excludeId,
}: {
  communeId: string;
  categorySlug: string;
  excludeId: string;
}) {
  const supabase = await createClient();
  const similar = await listSimilarAnnouncements(supabase, communeId, categorySlug, excludeId);

  if (similar.length === 0) return null;

  return (
    <Card className={`space-y-3 p-5 ${DETAIL_CARD_CLASS}`}>
      <h2 className="text-lg font-semibold text-text">Annonces similaires</h2>
      <div className="space-y-3">
        {similar.map((s: AnnouncementWithAuthor) => (
          <AnnouncementCard key={s.id} announcement={s} layout="horizontal" />
        ))}
      </div>
    </Card>
  );
}

function SimilarAnnouncementsSkeleton() {
  return (
    <Card className={`space-y-3 p-5 ${DETAIL_CARD_CLASS}`}>
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
  );
}
