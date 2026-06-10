import { notFound } from "next/navigation";
import {
  submitArchiveInitiative,
  submitDeleteInitiative,
} from "@/lib/actions/initiatives";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { getContentCategoryLabel } from "@/lib/constants/content-categories";
import { getInitiativeDetail } from "@/lib/data/initiatives";
import {
  formatLongDateFr,
  formatTimeFr,
} from "@/lib/utils/date";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { ContactButton } from "@/components/features/messaging/contact-button";
import { ReportButton } from "@/components/features/report-button";
import { InitiativeLocationMap } from "@/components/features/initiatives/initiative-location-map";
import { ParticipateButton } from "@/components/features/initiatives/participate-button";
import { PageStack } from "@/components/ui/page-stack";
import type { InitiativeAuthor } from "@/lib/types";

// Continental France fallback when no coordinates are available.
const FALLBACK_LAT = 46.6;
const FALLBACK_LNG = 2.3;

export default async function InitiativeDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const ctx = await requireActiveMembership();
  const membership = ctx.activeMembership!;

  const detail = await getInitiativeDetail(membership.commune_id, id, membership.id);
  if (!detail) notFound();

  const { initiative, author, participation } = detail;
  const isAuthor = initiative.author_membership_id === membership.id;

  const communeName = membership.commune?.name ?? "votre commune";
  const authorName = author?.displayName ?? "Un·e habitant·e";

  const dateLabel =
    initiative.date_mode === "once" && initiative.single_starts_at
      ? formatLongDateFr(initiative.single_starts_at)
      : null;
  const timeLabel = buildTimeLabel(initiative.single_starts_at, initiative.single_ends_at);
  const locationLabel = initiative.location_label ?? communeName;

  const mapLat =
    initiative.address_lat ?? membership.commune?.centroid_lat ?? FALLBACK_LAT;
  const mapLng =
    initiative.address_lng ?? membership.commune?.centroid_lng ?? FALLBACK_LNG;

  return (
    <PageStack gap="5">
      <BackLink href={ROUTES.initiatives.list}>← Retour aux initiatives</BackLink>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card className="space-y-5 p-6">
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <CategoryTag
                  label={getContentCategoryLabel(initiative.category_slug)}
                  className="bg-mint/10 text-mint"
                />
                <h1 className="text-[28px] font-bold leading-9 text-text">
                  {initiative.title}
                </h1>
                <p className="text-sm font-medium text-muted">
                  Initiative créée par {authorName} · {communeName}
                </p>
              </div>
              <ReportButton contextType="initiative" contextId={initiative.id} />
            </header>

            {initiative.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={initiative.photo_url}
                alt={initiative.title}
                className="aspect-[16/9] w-full rounded-2xl border border-border object-cover"
              />
            ) : (
              <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl gradient-initiative">
                <span className="text-4xl font-bold text-white/90">✦</span>
              </div>
            )}

            <dl className="grid gap-3 sm:grid-cols-2">
              {dateLabel ? <InfoRow icon={<CalendarIcon />} text={dateLabel} /> : null}
              {timeLabel ? <InfoRow icon={<ClockIcon />} text={timeLabel} /> : null}
              <InfoRow icon={<PinIcon />} text={`Rendez-vous : ${locationLabel}`} />
              <InfoRow
                icon={<UsersIcon />}
                text={formatParticipants(participation.count)}
              />
            </dl>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold leading-7 text-text">
                Description
              </h2>
              {initiative.description ? (
                <p className="whitespace-pre-line text-base font-medium leading-6 text-muted">
                  {initiative.description}
                </p>
              ) : (
                <p className="text-base font-medium italic text-muted">
                  Pas encore de détail : revenez bientôt.
                </p>
              )}
            </section>

            {isAuthor ? <AuthorActions initiativeId={initiative.id} /> : null}
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="space-y-3 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-text">
                {formatParticipants(participation.count)}
              </p>
              {participation.count > 0 ? (
                <AvatarStack count={participation.count} />
              ) : null}
            </div>
            <ParticipateButton
              initiativeId={initiative.id}
              isParticipating={participation.isParticipating}
            />
            <p className="text-xs font-medium text-subtle">
              Soutenez ce projet collectif et retrouvez-vous entre voisin·es.
            </p>
          </Card>

          <OrganizerCard author={author} fallbackName={authorName} />

          {!isAuthor ? (
            <Card className="space-y-3 p-6">
              <p className="text-sm font-semibold leading-5 text-text">
                Envie de participer ? Écrivez à l&apos;organisateur·rice.
              </p>
              <ContactButton
                contextType="initiative"
                contextId={initiative.id}
                contextTitle={initiative.title}
                gradient="initiative"
              />
            </Card>
          ) : null}

          <Card className="space-y-3 p-6">
            <h2 className="text-sm font-semibold text-text">Où ça se passe ?</h2>
            <InitiativeLocationMap
              latitude={mapLat}
              longitude={mapLng}
              label={locationLabel}
            />
            <p className="text-sm font-medium text-muted">{locationLabel}</p>
          </Card>
        </aside>
      </div>
    </PageStack>
  );
}

function buildTimeLabel(
  startsAt: string | null,
  endsAt: string | null,
): string | null {
  const start = startsAt ? formatTimeFr(startsAt) : null;
  if (!start) return null;
  const end = endsAt ? formatTimeFr(endsAt) : null;
  return end ? `De ${start} à ${end}` : `À partir de ${start}`;
}

function formatParticipants(count: number): string {
  if (count === 0) return "Soyez le·la premier·e à participer";
  return `${count} participant·e${count > 1 ? "s" : ""} inscrit·e${count > 1 ? "s" : ""}`;
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2.5 text-sm font-medium text-text">
      <span className="mt-0.5 shrink-0 text-mint">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function OrganizerCard({
  author,
  fallbackName,
}: {
  author: InitiativeAuthor | null;
  fallbackName: string;
}) {
  const name = author?.displayName ?? fallbackName;
  return (
    <Card className="space-y-3 p-6">
      <h2 className="text-sm font-semibold text-text">Organisateur·rice</h2>
      <div className="flex items-center gap-3">
        <Avatar name={name} avatarUrl={author?.avatarUrl ?? null} />
        <div>
          <p className="text-sm font-semibold text-text">{name}</p>
          <p className="text-xs font-medium text-muted">Habitant·e engagé·e</p>
        </div>
      </div>
    </Card>
  );
}

function Avatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className="h-11 w-11 rounded-full border border-border object-cover"
      />
    );
  }
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-full gradient-initiative text-base font-bold text-white">
      {initial}
    </span>
  );
}

function AvatarStack({ count }: { count: number }) {
  const shown = Math.min(count, 4);
  return (
    <div className="flex items-center -space-x-2">
      {Array.from({ length: shown }).map((_, i) => (
        <span
          key={i}
          className="h-7 w-7 rounded-full border-2 border-surface gradient-initiative"
        />
      ))}
      {count > shown ? (
        <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-warm text-[10px] font-bold text-muted">
          +{count - shown}
        </span>
      ) : null}
    </div>
  );
}

function AuthorActions({ initiativeId }: { initiativeId: string }) {
  return (
    <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
      <form action={submitArchiveInitiative}>
        <input type="hidden" name="id" value={initiativeId} />
        <Button type="submit" variant="secondary" className="text-xs">
          Archiver
        </Button>
      </form>
      <form action={submitDeleteInitiative}>
        <input type="hidden" name="id" value={initiativeId} />
        <Button type="submit" variant="danger" className="text-xs">
          Supprimer
        </Button>
      </form>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
