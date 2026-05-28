import Link from "next/link";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { ANNOUNCEMENT_STATUS } from "@/lib/constants/statuses";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementTypeTag } from "@/components/ui/announcement-type-tag";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { ListGrid, PageStack } from "@/components/ui/page-stack";
import { PageHeading } from "@/components/ui/page-heading";
import type { Announcement } from "@/lib/types";
import { getCategoryLabel } from "@/lib/constants/announcement-categories";

export default async function AnnoncesListePage() {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const { data } = await supabase
    .from("announcements")
    .select("*")
    .eq("commune_id", ctx.activeMembership!.commune_id)
    .in("status", [ANNOUNCEMENT_STATUS.ouverte, ANNOUNCEMENT_STATUS.pourvue])
    .order("created_at", { ascending: false });

  const announcements = (data ?? []) as Announcement[];

  return (
    <PageStack>
      <header className="flex flex-wrap items-start justify-between gap-3 md:items-center">
        <PageHeading
          title="Annonces"
          subtitle="Demandes et offres proches de votre adresse communautaire."
        />
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button href={ROUTES.annonces.map} variant="secondary" className="shadow-card">
            Voir la carte
          </Button>
          <Button href={ROUTES.annonces.new()} className="whitespace-nowrap px-4 py-2 text-xs">
            Ajouter une annonce
          </Button>
        </div>
      </header>
      {announcements.length === 0 ? (
        <Card className="p-5 text-center text-sm font-medium text-muted">
          Soyez les premiers voisin·es à publier un besoin ou une petite aide.
        </Card>
      ) : (
        <ListGrid>
          {announcements.map((a) => (
            <Link href={ROUTES.annonces.detail(a.id)} key={a.id} className="h-full">
              <Card className="flex h-full flex-col space-y-2 p-5 transition hover:border-purple/45">
                <div className="flex flex-wrap items-center gap-2">
                  <AnnouncementTypeTag type={a.type} />
                  <CategoryTag label={getCategoryLabel(a.category_slug)} />
                </div>
                <h3 className="text-xl font-semibold leading-7 text-text">{a.title}</h3>
                {a.description ? (
                  <p className="line-clamp-2 text-sm font-medium leading-5 text-muted">
                    {a.description}
                  </p>
                ) : null}
                <span className="mt-auto text-[10px] font-semibold text-subtle">
                  Statut : {a.status}
                </span>
              </Card>
            </Link>
          ))}
        </ListGrid>
      )}
    </PageStack>
  );
}
