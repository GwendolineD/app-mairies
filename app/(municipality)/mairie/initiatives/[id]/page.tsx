import { notFound } from "next/navigation";
import { requireCommuneStaff } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { getAuthorName } from "@/lib/data/authors";
import { createClient } from "@/lib/supabase/server";
import { formatDay, formatEventRange } from "@/lib/utils/date";
import { BackLink } from "@/components/ui/back-link";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { ContentTypeTag } from "@/components/ui/content-type-tag";
import { PageStack } from "@/components/ui/page-stack";
import type { InitiativeRecord } from "@/lib/types";

export default async function MairieInitiativeDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const { communeId } = await requireCommuneStaff();
  if (!communeId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("initiatives")
    .select("*")
    .eq("id", id)
    .eq("commune_id", communeId)
    .single();

  if (!data) notFound();
  const ini = data as InitiativeRecord;
  const author = await getAuthorName(supabase, ini.author_membership_id);

  const schedule =
    ini.date_mode === "once" && ini.single_starts_at && ini.single_ends_at
      ? formatEventRange(ini.single_starts_at, ini.single_ends_at)
      : ini.date_mode === "recurring"
        ? "Récurrente"
        : "Sans date";

  return (
    <PageStack gap="5">
      <BackLink href={ROUTES.mairie.initiatives}>
        ← Toutes les initiatives
      </BackLink>
      <Card className="space-y-4 p-6 lg:max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <ContentTypeTag type="initiative" />
          <CategoryTag
            label={ini.status === "active" ? "Active" : "Archivée"}
            className="bg-warm"
          />
        </div>
        <h1 className="text-[28px] font-bold leading-9 text-text">
          {ini.title}
        </h1>
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <Field label="Auteur·e" value={author} />
          <Field label="Créée le" value={formatDay(ini.created_at)} />
          <Field label="Planning" value={schedule} />
        </dl>
        {ini.description ? (
          <p className="whitespace-pre-line text-base font-medium leading-6 text-muted">
            {ini.description}
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
