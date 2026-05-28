import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementTypeTag } from "@/components/ui/announcement-type-tag";
import { AssetPlaceholder } from "@/components/ui/asset-placeholder";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { ReportButton } from "@/components/features/report-button";
import { getCategoryLabel } from "@/lib/constants/announcement-categories";
import type { Announcement } from "@/lib/types";

export default async function AnnonceDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const { data } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .eq("commune_id", ctx.activeMembership!.commune_id)
    .single();

  if (!data) notFound();

  const ann = data as Announcement;

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <Link href="/annonces" className="text-xs font-semibold text-purple underline">
        ← Toutes les annonces
      </Link>
      <Card className="space-y-4 p-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <AnnouncementTypeTag type={ann.type} />
              <CategoryTag label={getCategoryLabel(ann.category_slug)} />
              <CategoryTag label={ann.status} className="bg-warm" />
            </div>
            <h1 className="text-[28px] font-bold leading-9 text-text">{ann.title}</h1>
          </div>
          <ReportButton contextType="announcement" contextId={ann.id} />
        </header>
        {ann.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ann.photo_url}
            alt=""
            className="rounded-2xl border border-border"
          />
        ) : (
          <AssetPlaceholder
            description="Photo de l'annonce — illustration à venir"
            aspectRatio="16/9"
            className="rounded-2xl"
          />
        )}
        {ann.description ? (
          <p className="whitespace-pre-line text-base font-medium leading-6 text-muted">
            {ann.description}
          </p>
        ) : (
          <p className="text-base font-medium italic text-muted">
            Pas de détail complémentaire.
          </p>
        )}
        <ContactPlaceholder />
      </Card>
    </div>
  );
}

function ContactPlaceholder() {
  return (
    <AssetPlaceholder
      description="Messagerie chaleureuse — création automatique de conversation à venir"
      className="min-h-24 flex-col gap-2 rounded-3xl"
    />
  );
}
