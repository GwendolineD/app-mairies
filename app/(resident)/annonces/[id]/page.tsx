import { notFound } from "next/navigation";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementTypeTag } from "@/components/ui/announcement-type-tag";
import { AssetPlaceholder } from "@/components/ui/asset-placeholder";
import { BackLink } from "@/components/ui/back-link";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { ContactButton } from "@/components/features/messaging/contact-button";
import { ReportButton } from "@/components/features/report-button";
import { getCategoryLabel } from "@/lib/constants/announcement-categories";
import type { Announcement } from "@/lib/types";
import { PageStack } from "@/components/ui/page-stack";

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
  const isAuthor = ann.author_membership_id === ctx.activeMembership?.id;

  return (
    <PageStack gap="5">
      <BackLink href={ROUTES.annonces.list}>← Toutes les annonces</BackLink>
      <Card className="space-y-4 p-6 lg:max-w-4xl">
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
        {isAuthor ? (
          <p className="rounded-2xl bg-warm px-4 py-3 text-sm font-medium text-muted">
            C&apos;est votre annonce : les messages reçus apparaîtront dans
            l&apos;onglet Messages.
          </p>
        ) : (
          <div className="space-y-3 rounded-2xl bg-warm/60 p-4">
            <p className="text-sm font-semibold leading-5 text-text">
              Intéressé·e ? Écrivez à l&apos;auteur·e de l&apos;annonce.
            </p>
            <ContactButton
              contextType="announcement"
              contextId={ann.id}
              contextTitle={ann.title}
              gradient={ann.type === "offre" ? "offre" : "demande"}
            />
          </div>
        )}
      </Card>
    </PageStack>
  );
}
