import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
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
      <Link href="/annonces" className="text-xs font-semibold text-purple">
        ← Toutes les annonces
      </Link>
      <Card className="space-y-4 p-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-muted">
                {ann.type}
              </span>
              <CategoryTag label={getCategoryLabel(ann.category_slug)} />
              <span className="rounded-full bg-warm px-2 py-0.5 text-[10px] font-semibold text-text">
                {ann.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-text">{ann.title}</h1>
          </div>
          <ReportButton contextType="announcement" contextId={ann.id} />
        </header>
        {ann.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ann.photo_url}
            alt=""
            className="rounded-3xl border border-border"
          />
        ) : null}
        {ann.description ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
            {ann.description}
          </p>
        ) : (
          <p className="text-sm text-muted italic">Pas de détail complémentaire.</p>
        )}
        <ContactPlaceholder />
      </Card>
    </div>
  );
}

function ContactPlaceholder() {
  return (
    <div className="rounded-3xl bg-warm px-4 py-3 text-xs text-muted">
      <p className="font-semibold text-text">Messagerie chaleureuse</p>
      <p className="mt-1">
        Dans une prochaine itération, nous brancherons ici la création automatique de
        conversation lorsque votre voisin accepte votre sollicitation. Pour ce prototype,
      </p>
      <Button
        variant="secondary"
        type="button"
        disabled
        className="mt-3 w-full rounded-full text-xs opacity-70"
      >
        Contacter (placeholder)
      </Button>
    </div>
  );
}
