import Link from "next/link";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { EVENT_STATUS } from "@/lib/constants/statuses";
import { createClient } from "@/lib/supabase/server";
import { formatEventRange } from "@/lib/utils/date";
import { Card } from "@/components/ui/card";
import { ContentTypeTag } from "@/components/ui/content-type-tag";
import { ListGrid, PageStack } from "@/components/ui/page-stack";
import { PageHeading } from "@/components/ui/page-heading";
import type { AgendaEventRecord } from "@/lib/types";

export default async function EvenementsListePage() {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("commune_id", ctx.activeMembership!.commune_id)
    .eq("status", EVENT_STATUS.active)
    .order("starts_at", { ascending: true });

  const rows = (data ?? []) as AgendaEventRecord[];

  return (
    <PageStack gap="5">
      <PageHeading
        title="Événements"
        subtitle="Les moments où l'on se retrouvent physiquement, avec douceur et rires."
      />
      {rows.length === 0 ? (
        <Card className="p-5 text-center text-sm font-medium text-muted">
          Une place au calendrier attend votre prochaine animation conviviale.
        </Card>
      ) : (
        <ListGrid>
          {rows.map((event) => (
            <Link href={ROUTES.evenements.detail(event.id)} key={event.id} className="h-full">
              <Card className="flex h-full flex-col space-y-2 p-4 transition hover:border-purple/35">
                <div className="flex flex-wrap items-center gap-2">
                  <ContentTypeTag type="event" />
                  <h3 className="text-xl font-semibold leading-7 text-text">{event.title}</h3>
                </div>
                <p className="text-[10px] font-semibold text-subtle">
                  {formatEventRange(event.starts_at, event.ends_at)}
                </p>
                <p className="line-clamp-3 text-sm font-medium leading-5 text-muted">
                  {event.description}
                </p>
              </Card>
            </Link>
          ))}
        </ListGrid>
      )}
    </PageStack>
  );
}
