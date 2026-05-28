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
import { ReportButton } from "@/components/features/report-button";
import type { AgendaEventRecord } from "@/lib/types";

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
    <div className="flex flex-col gap-5 px-4 py-6">
      <BackLink href={ROUTES.evenements.list}>← Liste</BackLink>
      <Card className="space-y-4 p-6">
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
        ) : null}
      </Card>
    </div>
  );
}
