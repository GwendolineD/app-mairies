import { notFound } from "next/navigation";
import { requireActiveMembership } from "@/lib/auth/session";
import {
  getInitiativeCategoryLabel,
  getInitiativeCategoryDefaultImageUrl,
  getInitiativeCategoryColorHex,
  getInitiativeCategoryMapPinUrl,
} from "@/lib/constants/initiative-categories";
import { listInitiativeSupporters } from "@/lib/queries/initiatives";
import { createClient } from "@/lib/supabase/server";
import { HistoryBackLink } from "@/components/ui/history-back-link";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { ReportButton } from "@/components/features/report-button";
import { InitiativeSidebarActions } from "@/components/features/initiative-sidebar-actions";
import { AnnouncementLocationMap } from "@/components/features/announcement-location-map";
import { AnnouncementAddressLines } from "@/components/features/announcement-address-lines";
import { UserAvatar } from "@/components/ui/user-avatar";
import { LinkifiedText } from "@/components/ui/linkified-text";
import type { InitiativeEditData, InitiativeRecord } from "@/lib/types";
import { PageStack } from "@/components/ui/page-stack";
import { formatMemberSince, formatRelativeTime } from "@/lib/utils/date";
import { formatDisplayName } from "@/lib/utils/display-name";
import { formatAddressLines } from "@/lib/utils/format-address";

const MAIN_DETAIL_CARD_CLASS =
  "rounded-none border-0 bg-transparent p-0 !shadow-none";
const DETAIL_CARD_CLASS =
  "rounded-none border-0 bg-transparent p-0 !shadow-none md:rounded-xl md:border md:border-border/60 md:bg-surface";
const DESCRIPTION_SECTION_CLASS =
  "rounded-md border border-border/60 p-4";
const DETAIL_BADGE_CLASS =
  "h-[22px] px-2.5 py-0 text-[10px] leading-none";
const DETAIL_CATEGORY_TAG_CLASS = `${DETAIL_BADGE_CLASS} w-fit font-semibold`;

function buildInitiativeEditData(
  initiative: InitiativeRecord,
  membership: {
    address_street: string | null;
    address_city: string | null;
    address_citycode: string | null;
    address_postcode: string | null;
    address_lat: number | null;
    address_lng: number | null;
  },
): InitiativeEditData {
  const labelParts = (initiative.address_label ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const addressStreet = labelParts[0] ?? membership.address_street ?? "";
  const addressCity =
    labelParts.length > 1
      ? labelParts.slice(1).join(", ")
      : (membership.address_city ?? "");

  return {
    categorySlug: initiative.category_slug ?? "solidarite",
    title: initiative.title,
    description: initiative.description ?? "",
    photoUrl: initiative.photo_url ?? "",
    addressStreet,
    addressCity,
    addressCitycode: membership.address_citycode ?? "",
    addressPostcode: membership.address_postcode ?? "",
    addressLat: initiative.address_lat ?? membership.address_lat ?? 0,
    addressLng: initiative.address_lng ?? membership.address_lng ?? 0,
  };
}

export default async function InitiativeDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const ctx = await requireActiveMembership();
  const supabase = await createClient();
  const membership = ctx.activeMembership!;

  const { data } = await supabase
    .from("initiatives")
    .select("*")
    .eq("commune_id", membership.commune_id)
    .eq("id", id)
    .single();

  if (!data) notFound();

  const initiative = data as InitiativeRecord;
  const isAuthor = initiative.author_membership_id === membership.id;

  const { count: supportCount } = await supabase
    .from("initiative_responses")
    .select("id", { count: "exact", head: true })
    .eq("initiative_id", id)
    .eq("response_type", "support");

  const { data: userSupport } = await supabase
    .from("initiative_responses")
    .select("id")
    .eq("initiative_id", id)
    .eq("membership_id", membership.id)
    .eq("response_type", "support")
    .maybeSingle();

  const { data: authorMembership } = await supabase
    .from("memberships")
    .select(
      "id, created_at, profiles(first_name, last_name, display_name, avatar_url)",
    )
    .eq("id", initiative.author_membership_id)
    .single();

  type AuthorMembership = {
    created_at: string;
    profiles: {
      first_name: string | null;
      last_name: string | null;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  };

  const authorData = authorMembership as AuthorMembership | null;
  const authorProfile = authorData?.profiles;
  const authorName =
    (authorProfile?.display_name ??
      [authorProfile?.first_name, authorProfile?.last_name]
        .filter(Boolean)
        .join(" ")) ||
    "Voisin·e";
  const authorDisplayName =
    authorProfile?.first_name && authorProfile?.last_name
      ? formatDisplayName(authorProfile.first_name, authorProfile.last_name)
      : authorName;
  const authorAvatarUrl = authorProfile?.avatar_url ?? null;
  const memberSince = authorData?.created_at
    ? formatMemberSince(authorData.created_at)
    : "Membre";

  const [{ data: linkedEvent }, supporters] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, starts_at")
      .eq("source_initiative_id", id)
      .eq("status", "active")
      .maybeSingle(),
    listInitiativeSupporters(supabase, id),
  ]);

  const editData = isAuthor
    ? buildInitiativeEditData(initiative, membership)
    : undefined;

  const imageUrl =
    initiative.photo_url ??
    (initiative.category_slug
      ? getInitiativeCategoryDefaultImageUrl(initiative.category_slug)
      : null);

  const addressLines = formatAddressLines(
    initiative.address_label,
    null,
    null,
  );

  return (
    <PageStack gap="5">
      <HistoryBackLink label="Retour aux initiatives" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <Card className={`space-y-5 ${MAIN_DETAIL_CARD_CLASS}`}>
          <div className="space-y-5">
            <header className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {initiative.category_slug ? (
                    <CategoryTag
                      label={getInitiativeCategoryLabel(initiative.category_slug)}
                      colorHex={getInitiativeCategoryColorHex(
                        initiative.category_slug,
                      )}
                      className={DETAIL_CATEGORY_TAG_CLASS}
                      borderMatchBackground
                    />
                  ) : null}
                </div>
                <p className="hidden shrink-0 text-xs text-muted md:block">
                  {formatRelativeTime(initiative.created_at)}
                </p>
              </div>
              <h1 className="text-2xl font-bold leading-8 text-text">
                {initiative.title}
              </h1>
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
                    {formatRelativeTime(initiative.created_at)}
                  </p>
                </div>
              </div>
            </header>

            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="aspect-[16/10] w-full rounded-lg border border-border object-cover"
              />
            ) : null}

            <section className={DESCRIPTION_SECTION_CLASS}>
              <h2 className="mb-2 text-sm font-semibold leading-5 text-text">
                Description
              </h2>
              {initiative.description ? (
                <LinkifiedText
                  text={initiative.description}
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

        <aside className="space-y-4">
          <InitiativeSidebarActions
            isAuthor={isAuthor}
            initiativeId={initiative.id}
            authorName={authorName}
            authorAvatarUrl={authorAvatarUrl}
            memberSince={memberSince}
            initialSupported={!!userSupport}
            initialSupportCount={supportCount ?? 0}
            supporters={supporters}
            editData={editData}
            linkedEvent={linkedEvent}
            className={DETAIL_CARD_CLASS}
          />

          <Card className={`gap-2 md:p-5 ${DETAIL_CARD_CLASS}`}>
            <h2 className="hidden text-lg font-semibold leading-7 text-text md:block">
              Localisation
            </h2>
            {initiative.address_lat != null &&
            initiative.address_lng != null ? (
              <AnnouncementLocationMap
                latitude={initiative.address_lat}
                longitude={initiative.address_lng}
                announcementTitle={initiative.title}
                addressLines={addressLines}
                categorySlug={initiative.category_slug ?? "autre"}
                mapPinUrl={
                  initiative.category_slug
                    ? getInitiativeCategoryMapPinUrl(initiative.category_slug)
                    : null
                }
                colorHex={
                  initiative.category_slug
                    ? getInitiativeCategoryColorHex(initiative.category_slug)
                    : undefined
                }
              />
            ) : (
              <AnnouncementAddressLines {...addressLines} size="md" />
            )}
          </Card>

          <div className="hidden md:flex md:justify-center">
            <ReportButton
              contextType="initiative"
              contextId={initiative.id}
              showIcon
              className="text-sm font-medium text-muted"
            />
          </div>
        </aside>
      </div>

      <div className="flex justify-center pb-2 md:hidden">
        <ReportButton
          contextType="initiative"
          contextId={initiative.id}
          showIcon
          className="text-sm font-medium text-muted"
        />
      </div>
    </PageStack>
  );
}
