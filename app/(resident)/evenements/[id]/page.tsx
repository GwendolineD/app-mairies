import { notFound } from "next/navigation";
import { submitArchiveEvent, submitDeleteEvent } from "@/lib/actions/events";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { formatEventDetail } from "@/lib/utils/date";
import { AssetPlaceholder } from "@/components/ui/asset-placeholder";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ContentTypeTag } from "@/components/ui/content-type-tag";
import { ContactButton } from "@/components/features/messaging/contact-button";
import { ReportButton } from "@/components/features/report-button";
import type { AgendaEventRecord } from "@/lib/types";
import { PageStack } from "@/components/ui/page-stack";
<<<<<<< HEAD
=======
import { CarteAnnoncesMap } from "@/components/features/carte-preview-map";
>>>>>>> preprod

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
  const isAuthor = event.author_membership_id === ctx.activeMembership?.id;

  return (
    <PageStack gap="5">
      <BackLink href={ROUTES.evenements.list}>← Liste</BackLink>
      <Card className="space-y-4 p-6 lg:max-w-4xl">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <ContentTypeTag type="event" />
            <h1 className="mt-2 text-[28px] font-bold leading-9 text-text">{event.title}</h1>
          </div>
          <ReportButton contextType="event" contextId={event.id} />
        </div>
        <AssetPlaceholder
          description="Illustration événement — style 3D Warm Community à venir"
          aspectRatio="16/9"
          className="rounded-2xl"
        />
        <p className="rounded-2xl bg-warm px-4 py-3 text-sm font-medium text-muted">
          {formatEventDetail(event.starts_at, event.ends_at)}
        </p>
        <p className="whitespace-pre-line text-base font-medium leading-6 text-muted">
          {event.description}
        </p>
        {isAuthor ? (
          <div className="flex gap-2">
            <form action={submitArchiveEvent}>
              <input type="hidden" name="id" value={event.id} />
              <Button type="submit" variant="secondary" className="text-xs">
                Archiver
              </Button>
            </form>
            <form action={submitDeleteEvent}>
              <input type="hidden" name="id" value={event.id} />
              <Button type="submit" variant="danger" className="text-xs">
                Supprimer
              </Button>
            </form>
          </div>
        ) : (
          <div className="space-y-3 rounded-2xl bg-warm/60 p-4">
            <p className="text-sm font-semibold leading-5 text-text">
              Une question sur l&apos;événement ? Écrivez à
              l&apos;organisateur·rice.
            </p>
            <ContactButton
              contextType="event"
              contextId={event.id}
              contextTitle={event.title}
              gradient="events"
            />
<<<<<<< HEAD
          </div>
        )}
      </Card>
=======
          )}
          <p className="rounded-2xl bg-warm px-4 py-3 text-sm font-medium text-muted">
            {formatEventDetail(event.starts_at, event.ends_at)}
          </p>
          {event.address_label ? (
            <p className="text-sm text-muted">Lieu : {event.address_label}</p>
          ) : null}
          <p className="whitespace-pre-line text-base font-medium leading-6 text-muted">
            {event.description}
          </p>
          {isAuthor ? (
            <div className="flex gap-2">
              <form action={submitArchiveEvent}>
                <input type="hidden" name="id" value={event.id} />
                <Button type="submit" variant="secondary" className="text-xs">
                  Archiver
                </Button>
              </form>
              <form action={submitDeleteEvent}>
                <input type="hidden" name="id" value={event.id} />
                <Button type="submit" variant="danger" className="text-xs">
                  Supprimer
                </Button>
              </form>
            </div>
          ) : null}
        </Card>
        {event.address_lat != null && event.address_lng != null ? (
          <Card className="p-4">
            <h2 className="mb-2 text-lg font-semibold text-text">Carte</h2>
            <CarteAnnoncesMap
              latitude={event.address_lat}
              longitude={event.address_lng}
              communeName={event.title}
              className="h-48 rounded-2xl overflow-hidden border border-border/70"
            />
          </Card>
        ) : null}
      </div>
>>>>>>> preprod
    </PageStack>
  );
}
