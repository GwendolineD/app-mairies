import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Calendar } from "lucide-react";
import { requireActiveMembership } from "@/lib/auth/session";
import { listSimilarAnnouncements } from "@/lib/queries/announcements";
import type { AnnouncementWithAuthor } from "@/lib/queries/announcements";
import { createClient } from "@/lib/supabase/server";
import {
  getCategoryColorHex,
  getCategoryLabel,
} from "@/lib/constants/announcement-categories";
import { HistoryBackLink } from "@/components/ui/history-back-link";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { Skeleton } from "@/components/ui/skeleton";
import { AnnouncementTypePastille } from "@/components/ui/announcement-type-pastille";
import { AnnouncementCard } from "@/components/features/announcement-card";
import { AnnouncementAddressLines } from "@/components/features/announcement-address-lines";
import { AnnouncementLocationMap } from "@/components/features/announcement-location-map";
import { AnnouncementSidebarActions } from "@/components/features/announcement-sidebar-actions";
import { ReportButton } from "@/components/features/report-button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { LinkifiedText } from "@/components/ui/linkified-text";
import { formatMemberSince, formatRelativeTime } from "@/lib/utils/date";
import { formatDisplayName } from "@/lib/utils/display-name";
import { formatShortDate } from "@/lib/utils/format-date";
import { formatDetailAddressLines, resolveAddressPostcode } from "@/lib/utils/format-address";
import type { AnnouncementEditData } from "@/lib/types";
import { PageStack } from "@/components/ui/page-stack";

const MAIN_DETAIL_CARD_CLASS =
  "rounded-none border-0 bg-transparent p-0 !shadow-none";
const DETAIL_CARD_CLASS =
  "rounded-none border-0 bg-transparent p-0 !shadow-none md:rounded-xl md:border md:border-border/60 md:bg-surface";
const DESCRIPTION_SECTION_CLASS =
  "rounded-md border border-border/60 p-4";
const DETAIL_BADGE_CLASS =
  "h-[22px] px-2.5 py-0 text-[10px] leading-none";
const DETAIL_TYPE_PASTILLE_CLASS = `${DETAIL_BADGE_CLASS} gap-1 shadow-none [&_svg]:size-3`;
const DETAIL_CATEGORY_TAG_CLASS = `${DETAIL_BADGE_CLASS} w-fit font-semibold`;

export default async function AnnonceDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const { data } = await supabase
    .from("announcements")
    .select(
      `*, announcement_categories(map_pin_url, color_hex),
      author_membership:memberships!announcements_author_membership_id_fkey(
        created_at,
        address_street,
        address_city,
        address_postcode,
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

  // If the content is suspended, show appropriate screen
  if (data.suspended_at) {
    const isAuthorOfSuspended =
      data.author_membership_id === ctx.activeMembership!.id;
    const isStaff =
      ctx.profile.is_platform_admin ||
      (ctx.activeMembership!.role === "staff" || ctx.activeMembership!.role === "mayor");

    if (!isStaff) {
      return (
        <PageStack gap="5">
          <HistoryBackLink />
          <Card className="mx-auto max-w-lg space-y-4 p-8 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-coral/10">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-text">Annonce suspendue</h1>
            {isAuthorOfSuspended ? (
              <p className="text-sm text-muted">
                Votre annonce a été suspendue par la modération. Si vous pensez
                qu&apos;il s&apos;agit d&apos;une erreur, veuillez contacter
                l&apos;assistance.
              </p>
            ) : (
              <p className="text-sm text-muted">
                Ce contenu a été suspendu et n&apos;est plus disponible.
              </p>
            )}
          </Card>
        </PageStack>
      );
    }
  }

  type EnrichedAnnouncement = typeof data & {
    announcement_categories: {
      map_pin_url: string | null;
      color_hex: string | null;
    } | null;
    author_membership: {
      created_at: string;
      address_street: string | null;
      address_city: string | null;
      address_postcode: string | null;
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
  const authorDisplayName =
    authorProfile?.first_name && authorProfile?.last_name
      ? formatDisplayName(authorProfile.first_name, authorProfile.last_name)
      : authorName;
  const authorAvatarUrl = authorProfile?.avatar_url ?? null;
  const memberSince = ann.author_membership?.created_at
    ? formatMemberSince(ann.author_membership.created_at)
    : "Membre";

  const addressLines = formatDetailAddressLines({
    street: ann.address_street,
    postcode: ann.address_postcode,
    city: ann.address_city,
    fallbackPostcode: ann.author_membership?.address_postcode,
  });

  const resolvedPostcode = resolveAddressPostcode(
    ann.address_postcode,
    ann.author_membership?.address_postcode,
  );

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
    addressPostcode: resolvedPostcode ?? "",
    addressLat: ann.address_lat ?? 0,
    addressLng: ann.address_lng ?? 0,
  };

  return (
    <PageStack gap="5">
      <HistoryBackLink />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        {/* --- Main card --- */}
        <Card className={`space-y-5 ${MAIN_DETAIL_CARD_CLASS}`}>
          <div className="space-y-5">
            <header className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <AnnouncementTypePastille
                    type={ann.type}
                    className={DETAIL_TYPE_PASTILLE_CLASS}
                  />
                  <CategoryTag
                    label={getCategoryLabel(ann.category_slug)}
                    colorHex={getCategoryColorHex(ann.category_slug)}
                    className={DETAIL_CATEGORY_TAG_CLASS}
                    borderMatchBackground
                  />
                </div>
                <p className="hidden shrink-0 text-xs text-muted md:block">
                  {formatRelativeTime(ann.created_at)}
                </p>
              </div>
              <h1 className="text-2xl font-bold leading-8 text-text">{ann.title}</h1>
              {ann.target_date ? (
                <p className="flex items-center gap-1.5 text-sm font-medium text-muted">
                  <Calendar className="size-4 shrink-0 text-subtle" aria-hidden />
                  <time dateTime={ann.target_date}>
                    Échéance le {formatShortDate(ann.target_date)}
                  </time>
                </p>
              ) : null}
              <div className="flex items-center gap-3 md:hidden">
                <UserAvatar
                  name={authorName}
                  url={authorAvatarUrl}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text">
                    {authorDisplayName}
                  </p>
                  <p className="text-[10px] leading-4 text-muted">
                    {formatRelativeTime(ann.created_at)}
                  </p>
                </div>
              </div>
            </header>

            {ann.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ann.photo_url}
                alt=""
                className="aspect-[16/10] w-full rounded-lg border border-border object-cover"
              />
            ) : null}

            <section className={DESCRIPTION_SECTION_CLASS}>
              <h2 className="mb-2 text-sm font-semibold leading-5 text-text">
                Description
              </h2>
              {ann.description ? (
                <LinkifiedText
                  text={ann.description}
                  className="scrollbar-hover max-h-64 overflow-y-auto whitespace-pre-line text-base font-medium leading-6 text-muted"
                />
              ) : (
                <p className="text-base font-medium italic text-muted">
                  Pas de détail complémentaire.
                </p>
              )}
            </section>
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
          <Card className={`gap-2 md:p-5 ${DETAIL_CARD_CLASS}`}>
            <h2 className="hidden text-lg font-semibold leading-7 text-text md:block">
              Localisation
            </h2>
            {ann.address_lat != null && ann.address_lng != null ? (
              <AnnouncementLocationMap
                latitude={ann.address_lat}
                longitude={ann.address_lng}
                announcementTitle={ann.title}
                addressLines={addressLines}
                categorySlug={ann.category_slug}
                mapPinUrl={ann.announcement_categories?.map_pin_url ?? null}
                colorHex={
                  ann.announcement_categories?.color_hex ??
                  getCategoryColorHex(ann.category_slug)
                }
              />
            ) : (
              <AnnouncementAddressLines {...addressLines} size="md" />
            )}
          </Card>

          <div className="hidden md:flex md:justify-center">
            <ReportButton
              contextType="announcement"
              contextId={ann.id}
              showIcon
              className="text-sm font-medium text-muted"
            />
          </div>

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

      <div className="flex justify-center pb-2 md:hidden">
        <ReportButton
          contextType="announcement"
          contextId={ann.id}
          showIcon
          className="text-sm font-medium text-muted"
        />
      </div>
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
