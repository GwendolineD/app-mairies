import { notFound } from "next/navigation";
import { requireCommuneStaff } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { getCategoryLabel } from "@/lib/constants/announcement-categories";
import { getAuthorName } from "@/lib/data/authors";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/utils/date";
import { AnnouncementTypeTag } from "@/components/ui/announcement-type-tag";
import { BackLink } from "@/components/ui/back-link";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { PageStack } from "@/components/ui/page-stack";
import type { Announcement } from "@/lib/types";

export default async function MairieAnnonceDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const { communeId } = await requireCommuneStaff();

  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .eq("commune_id", communeId)
    .single();

  if (!data) notFound();
  const ann = data as Announcement;
  const author = await getAuthorName(supabase, ann.author_membership_id);

  return (
    <PageStack gap="5">
      <BackLink href={ROUTES.mairie.annonces}>← Toutes les annonces</BackLink>
      <Card className="space-y-4 p-6 lg:max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <AnnouncementTypeTag type={ann.type} />
          <CategoryTag label={getCategoryLabel(ann.category_slug)} />
          <CategoryTag label={ann.status} className="bg-warm" />
        </div>
        <h1 className="text-[28px] font-bold leading-9 text-text">
          {ann.title}
        </h1>
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <Field label="Auteur·e" value={author} />
          <Field label="Publiée le" value={formatDay(ann.created_at)} />
          <Field
            label="Échéance"
            value={ann.target_date ? formatDay(ann.target_date) : "—"}
          />
        </dl>
        {ann.description ? (
          <p className="whitespace-pre-line text-base font-medium leading-6 text-muted">
            {ann.description}
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
