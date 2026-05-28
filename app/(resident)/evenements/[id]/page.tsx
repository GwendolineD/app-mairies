import Link from "next/link";
import { notFound } from "next/navigation";
import { submitArchiveEvent, submitDeleteEvent } from "@/lib/actions/events";
import { requireActiveMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AssetPlaceholder } from "@/components/ui/asset-placeholder";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
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
      <Link href="/evenements" className="text-xs font-semibold text-purple underline">
        ← Liste
      </Link>
      <Card className="space-y-4 p-6">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <CategoryTag label="Événement" className="bg-orange/10 text-orange" />
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
          {new Intl.DateTimeFormat("fr-FR", {
            dateStyle: "full",
            timeStyle: "short",
          }).format(new Date(event.starts_at))}
          {" — "}
          {new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" }).format(
            new Date(event.ends_at),
          )}
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
