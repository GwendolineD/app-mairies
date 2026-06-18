import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { requireActiveMembership } from "@/lib/auth/session";
import {
  getInitiativeCategoryColorHex,
  getInitiativeCategoryDefaultImageUrl,
  getInitiativeCategoryLabel,
  getInitiativeCategoryMapPinUrl,
} from "@/lib/constants/initiative-categories";
import { createClient } from "@/lib/supabase/server";
import { formatEventDetail } from "@/lib/utils/date";
import { formatAddressLines } from "@/lib/utils/format-address";
import { HistoryBackLink } from "@/components/ui/history-back-link";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { LinkifiedText } from "@/components/ui/linkified-text";
import { ReportButton } from "@/components/features/report-button";
import { EventSidebarActions } from "@/components/features/event-sidebar-actions";
import { AnnouncementLocationMap } from "@/components/features/announcement-location-map";
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
  const labelParts = (event.address_label ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    categorySlug: event.category_slug ?? "solidarite",
    title: event.title,
    description: event.description ?? "",
    photoUrl: event.photo_url ?? "",
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    volunteersNeeded: event.volunteers_needed,
    addressStreet: labelParts[0] ?? "",
    addressCity: labelParts.slice(1).join(", ") ?? "",
    addressCitycode: "",
    addressPostcode: "",
    addressLat: event.address_lat ?? 0,
    addressLng: event.address_lng ?? 0,
    sourceInitiativeId: event.source_initiative_id ?? undefined,
  };
}

export default async function EvenementDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("commune_id", ctx.activeMembership!.commune_id)
    .eq("id", id)
    .single();

  if (!data) notFound();
  const event = data as AgendaEventRecord;

  // If the content is suspended, show appropriate screen
  if (event.suspended_at) {
    const isAuthorOfSuspended = event.author_membership_id === ctx.activeMembership?.id;
    const isStaff =
      ctx.profile.is_platform_admin ||
      ctx.activeMembership!.role === "staff" ||
      ctx.activeMembership!.role === "mayor";

    if (!isStaff) {
      return (
        <PageStack gap="5">
          <HistoryBackLink />
          <Card className="mx-auto max-w-lg space-y-4 p-8 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-coral/10">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-text">Événement suspendu</h1>
            {isAuthorOfSuspended ? (
              <p className="text-sm text-muted">
                Votre événement a été suspendu par la modération. Si vous pensez
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

  const isAuthor = event.author_membership_id === ctx.activeMembership?.id;

  let sourceInitiative: { id: string; title: string } | null = null;
  if (event.source_initiative_id) {
    const { data: initiative } = await supabase
      .from("initiatives")
      .select("id, title")
      .eq("id", event.source_initiative_id)
      .maybeSingle();
    sourceInitiative = initiative;
  }

  const editData = isAuthor ? buildEventEditData(event) : undefined;

  const imageUrl =
    event.photo_url ??
    (event.category_slug
      ? getInitiativeCategoryDefaultImageUrl(event.category_slug)
      : null);

  const addressLines = formatAddressLines(event.address_label, null, null);

  return (
    <PageStack gap="5">
      <HistoryBackLink />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <Card className={`space-y-5 ${MAIN_DETAIL_CARD_CLASS}`}>
          <div className="space-y-5">
            <header className="space-y-3">
              <div className="flex items-center justify-between gap-3">
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
              </div>
              <h1 className="text-2xl font-bold leading-8 text-text">
                {event.title}
              </h1>
            </header>

            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="aspect-[16/10] w-full rounded-lg border border-border object-cover"
              />
            ) : null}

            <div className="flex flex-col gap-2 rounded-xl bg-warm p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-orange">
                <CalendarDays className="size-4 shrink-0" aria-hidden />
                {formatEventDetail(event.starts_at, event.ends_at)}
              </p>
              {event.address_label ? (
                <p className="flex items-center gap-2 text-sm font-medium text-muted">
                  <MapPin className="size-4 shrink-0" aria-hidden />
                  {event.address_label}
                </p>
              ) : null}
            </div>

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
            isAuthor={isAuthor}
            eventId={event.id}
            volunteersNeeded={event.volunteers_needed}
            editData={editData}
            sourceInitiative={sourceInitiative}
            className={DETAIL_CARD_CLASS}
          />

          <Card className={`gap-2 md:p-5 ${DETAIL_CARD_CLASS}`}>
            <h2 className="hidden text-lg font-semibold leading-7 text-text md:block">
              Localisation
            </h2>
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
              />
            ) : (
              <AnnouncementAddressLines {...addressLines} size="md" />
            )}
          </Card>

          <div className="hidden md:flex md:justify-center">
            <ReportButton
              contextType="event"
              contextId={event.id}
              showIcon
              className="text-sm font-medium text-muted"
            />
          </div>
        </aside>
      </div>

      <div className="flex justify-center pb-2 md:hidden">
        <ReportButton
          contextType="event"
          contextId={event.id}
          showIcon
          className="text-sm font-medium text-muted"
        />
      </div>
    </PageStack>
  );
}
