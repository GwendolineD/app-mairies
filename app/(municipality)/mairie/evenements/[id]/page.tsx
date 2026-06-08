import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { USER_ROLES } from "@/lib/constants/roles";
import { getAuthorName } from "@/lib/data/authors";
import { createClient } from "@/lib/supabase/server";
import { formatDay, formatEventDetail } from "@/lib/utils/date";
import { BackLink } from "@/components/ui/back-link";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { ContentTypeTag } from "@/components/ui/content-type-tag";
import { PageStack } from "@/components/ui/page-stack";
import type { AgendaEventRecord } from "@/lib/types";

export default async function MairieEvenementDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const ctx = await requireRole([USER_ROLES.municipalityStaff]);
  const communeId = ctx.profile.active_commune_id;
  if (!communeId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("commune_id", communeId)
    .single();

  if (!data) notFound();
  const evt = data as AgendaEventRecord;
  const author = await getAuthorName(supabase, evt.author_membership_id);

  return (
    <PageStack gap="5">
      <BackLink href={ROUTES.mairie.evenements}>
        ← Tous les événements
      </BackLink>
      <Card className="space-y-4 p-6 lg:max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <ContentTypeTag type="event" />
          <CategoryTag
            label={evt.status === "active" ? "Actif" : "Archivé"}
            className="bg-warm"
          />
        </div>
        <h1 className="text-[28px] font-bold leading-9 text-text">
          {evt.title}
        </h1>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Auteur·e" value={author} />
          <Field label="Créé le" value={formatDay(evt.created_at)} />
        </dl>
        <p className="text-sm font-semibold text-text">
          {formatEventDetail(evt.starts_at, evt.ends_at)}
        </p>
        {evt.description ? (
          <p className="whitespace-pre-line text-base font-medium leading-6 text-muted">
            {evt.description}
          </p>
        ) : (
          <p className="text-base font-medium italic text-muted">
            Pas de détail complémentaire.
          </p>
        )}
      </Card>
    </PageStack>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="font-semibold text-text">{value}</dd>
    </div>
  );
}
