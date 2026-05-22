import Link from "next/link";
import { requireActiveMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import type { Announcement } from "@/lib/types";
import { getCategoryLabel } from "@/lib/constants/announcement-categories";

export default async function AnnoncesListePage() {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const { data } = await supabase
    .from("announcements")
    .select("*")
    .eq("commune_id", ctx.activeMembership!.commune_id)
    .in("status", ["ouverte", "pourvue"])
    .order("created_at", { ascending: false });

  const announcements = (data ?? []) as Announcement[];

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Annonces</h1>
          <p className="text-xs text-muted">
            Demandes et offres proches de votre adresse communautaire.
          </p>
        </div>
        <Link href="/annonces/nouvelle">
          <Button className="rounded-full px-4 py-2 text-xs">Ajouter une annonce</Button>
        </Link>
      </header>
      <div className="flex gap-3">
        <Link
          href="/annonces/carte"
          className="flex-1 rounded-2xl border border-border bg-surface px-4 py-3 text-center text-sm font-semibold text-text shadow-card"
        >
          Voir la carte
        </Link>
      </div>
      <section className="space-y-3">
        {announcements.length === 0 ? (
          <Card className="p-5 text-center text-sm text-muted">
            Soyez les premiers voisin·es à publier un besoin ou une petite aide.
          </Card>
        ) : (
          announcements.map((a) => (
            <Link href={`/annonces/${a.id}`} key={a.id}>
              <Card className="space-y-2 p-5 transition hover:border-purple/45">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-muted">
                    {a.type}
                  </span>
                  <CategoryTag label={getCategoryLabel(a.category_slug)} />
                </div>
                <h3 className="font-bold text-text">{a.title}</h3>
                {a.description ? (
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted">
                    {a.description}
                  </p>
                ) : null}
                <span className="text-[10px] font-semibold text-subtle">
                  Statut : {a.status}
                </span>
              </Card>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
