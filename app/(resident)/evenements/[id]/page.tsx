import Link from "next/link";
import { notFound } from "next/navigation";
import { submitArchiveEvent, submitDeleteEvent } from "@/lib/actions/events";
import { requireActiveMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      <Link href="/evenements" className="text-xs font-semibold text-purple">
        ← Liste
      </Link>
      <Card className="space-y-4 p-6">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase text-muted">Événement</p>
            <h1 className="text-2xl font-bold">{event.title}</h1>
          </div>
          <ReportButton contextType="event" contextId={event.id} />
        </div>
        <p className="rounded-3xl bg-warm px-4 py-2 text-xs font-medium text-muted">
          {new Intl.DateTimeFormat("fr-FR", {
            dateStyle: "full",
            timeStyle: "short",
          }).format(new Date(event.starts_at))}
          {" — "}
          {new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" }).format(
            new Date(event.ends_at),
          )}
        </p>
        <p className="whitespace-pre-line text-sm text-muted">{event.description}</p>
        {isAuthor ? (
          <div className="flex gap-2">
            <form action={submitArchiveEvent}>
              <input type="hidden" name="id" value={event.id} />
              <Button type="submit" variant="secondary" className="rounded-full text-xs">
                Archiver
              </Button>
            </form>
            <form action={submitDeleteEvent}>
              <input type="hidden" name="id" value={event.id} />
              <Button type="submit" variant="danger" className="rounded-full text-xs">
                Supprimer
              </Button>
            </form>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
