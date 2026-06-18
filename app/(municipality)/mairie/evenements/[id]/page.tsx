import { notFound } from "next/navigation";
import { requireCommuneStaff } from "@/lib/auth/session";
import {
  getInitiativeCategoryColorHex,
  getInitiativeCategoryDefaultImageUrl,
  getInitiativeCategoryLabel,
  getInitiativeCategoryMapPinUrl,
} from "@/lib/constants/initiative-categories";
import { ROUTES } from "@/lib/constants/routes";
import { getAuthorName, resolveEventAuthorLabel } from "@/lib/data/authors";
import { listVolunteerCountsByInitiativeId } from "@/lib/queries/events";
import { listInitiativeVolunteers } from "@/lib/queries/initiatives";
import { createClient } from "@/lib/supabase/server";
import { formatDay, formatEventDetail } from "@/lib/utils/date";
import {
  formatAddressLines,
  parseAddressLabelParts,
  resolveAddressPostcode,
} from "@/lib/utils/format-address";
import { BackLink } from "@/components/ui/back-link";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { LinkifiedText } from "@/components/ui/linkified-text";
import { EventSidebarActions } from "@/components/features/event-sidebar-actions";
import { AnnouncementLocationMap } from "@/components/features/announcement-location-map";
import { DetailLocationSidebarCard } from "@/components/features/detail-location-sidebar-card";
import { AnnouncementAddressLines } from "@/components/features/announcement-address-lines";
import type { AgendaEventRecord, EventEditData } from "@/lib/types";
import { PageStack } from "@/components/ui/page-stack";

const MAIN_DETAIL_CARD_CLASS =
  "rounded-none border-0 bg-transparent p-0 !shadow-none";
const DETAIL_CARD_CLASS =
  "rounded-none border-0 bg-transparent p-0 !shadow-none md:rounded-xl md:border md:border-border/60 md:bg-surface";
const DESCRIPTION_SECTION_CLASS = "rounded-md border border-border/60 p-4";
const DETAIL_BADGE_CLASS = "h-[22px] px-2.5 py-0 text-[10px] leading-none";
const DETAIL_CATEGORY_TAG_CLASS = `${DETAIL_BADGE_CLASS} w-fit font-semibold`;

function buildEventEditData(event: AgendaEventRecord): EventEditData {
  const parsedAddress = parseAddressLabelParts(event.address_label ?? "");

  return {
    categorySlug: event.category_slug ?? "solidarite",
    title: event.title,
    description: event.description ?? "",
    photoUrl: event.photo_url ?? "",
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    volunteersNeeded: event.volunteers_needed,
    addressStreet: parsedAddress.street ?? "",
    addressCity: parsedAddress.city ?? "",
    addressCitycode: "",
    addressPostcode: parsedAddress.postcode ?? "",
    addressLat: event.address_lat ?? 0,
    addressLng: event.address_lng ?? 0,
    sourceInitiativeId: event.source_initiative_id ?? undefined,
  };
}

export default async function MairieEvenementDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const ctx = await requireCommuneStaff();
  const communeId = ctx.communeId;
  if (!communeId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(
      `*,
      author_membership:memberships!events_author_membership_id_fkey(
        address_postcode
      )`,
    )
    .eq("id", id)
    .eq("commune_id", communeId)
    .eq("is_official", true)
    .single();

  if (!data) notFound();

  type EnrichedEvent = AgendaEventRecord & {
    author_membership: { address_postcode: string | null } | null;
  };

  const event = data as EnrichedEvent;
  const authorName = await getAuthorName(supabase, event.author_membership_id);
  const communeName = ctx.activeMembership?.commune?.name ?? null;
  const authorLabel = resolveEventAuthorLabel(
    event.is_official,
    authorName,
    communeName,
  );
  const editData = buildEventEditData(event);

  let sourceInitiative: { id: string; title: string } | null = null;
  if (event.source_initiative_id) {
    const { data: initiative } = await supabase
      .from("initiatives")
      .select("id, title")
      .eq("id", event.source_initiative_id)
      .maybeSingle();
    sourceInitiative = initiative;
  }

  const imageUrl =
    event.photo_url ??
    (event.category_slug
      ? getInitiativeCategoryDefaultImageUrl(event.category_slug)
      : null);

  const parsedAddress = parseAddressLabelParts(event.address_label ?? "");
  const resolvedPostcode = resolveAddressPostcode(
    parsedAddress.postcode,
    event.address_label,
    event.author_membership?.address_postcode,
  );
  const addressLines = formatAddressLines(
    parsedAddress.street,
    resolvedPostcode,
    parsedAddress.city,
  );

  let volunteersRegistered = 0;
  let volunteers: Awaited<ReturnType<typeof listInitiativeVolunteers>> = [];
  if (event.source_initiative_id) {
    const counts = await listVolunteerCountsByInitiativeId(supabase, [
      event.source_initiative_id,
    ]);
    volunteersRegistered = counts[event.source_initiative_id] ?? 0;
    volunteers = await listInitiativeVolunteers(supabase, event.source_initiative_id);
  }

  return (
    <PageStack gap="5">
      <BackLink href={ROUTES.mairie.evenements}>
        Événements officiels
      </BackLink>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <Card className={`space-y-5 ${MAIN_DETAIL_CARD_CLASS}`}>
          <div className="space-y-5">
            <header className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {event.category_slug ? (
                  <CategoryTag
                    label={getInitiativeCategoryLabel(event.category_slug)}
                    colorHex={getInitiativeCategoryColorHex(event.category_slug)}
                    className={DETAIL_CATEGORY_TAG_CLASS}
                    borderMatchBackground
                  />
                ) : null}
              </div>
              <h1 className="text-2xl font-bold leading-8 text-text">
                {event.title}
              </h1>
              <p className="text-sm font-medium text-muted">
                Par {authorLabel} · créé le {formatDay(event.created_at)}
              </p>
            </header>

            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="aspect-[16/10] w-full rounded-lg border border-border object-cover"
              />
            ) : null}

            <p className="text-base font-semibold text-orange">
              {formatEventDetail(event.starts_at, event.ends_at)}
            </p>

            <section className={DESCRIPTION_SECTION_CLASS}>
              <h2 className="mb-2 text-sm font-semibold leading-5 text-text">
                Description
              </h2>
              {event.description ? (
                <LinkifiedText
                  text={event.description}
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
          <EventSidebarActions
            isAuthor
            eventId={event.id}
            volunteersNeeded={event.volunteers_needed}
            volunteersRegistered={volunteersRegistered}
            volunteers={volunteers}
            editData={editData}
            sourceInitiative={sourceInitiative}
            className={DETAIL_CARD_CLASS}
            deleteRedirectHref={ROUTES.mairie.evenements}
          />

          <DetailLocationSidebarCard className={DETAIL_CARD_CLASS}>
            {event.address_lat != null && event.address_lng != null ? (
              <AnnouncementLocationMap
                latitude={event.address_lat}
                longitude={event.address_lng}
                announcementTitle={event.title}
                addressLines={addressLines}
                categorySlug={event.category_slug ?? "autre"}
                mapPinUrl={
                  event.category_slug
                    ? getInitiativeCategoryMapPinUrl(event.category_slug)
                    : null
                }
                colorHex={
                  event.category_slug
                    ? getInitiativeCategoryColorHex(event.category_slug)
                    : undefined
                }
                hideAddressIcon
              />
            ) : (
              <AnnouncementAddressLines {...addressLines} hideIcon />
            )}
          </DetailLocationSidebarCard>
        </aside>
      </div>
    </PageStack>
  );
}
