import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import {
  listSimilarAnnouncements,
} from "@/lib/queries/announcements";
import { createClient } from "@/lib/supabase/server";
import {
  getCategoryColorHex,
  getCategoryLabel,
} from "@/lib/constants/announcement-categories";
import { AnnouncementTypeTag } from "@/components/ui/announcement-type-tag";
import { AssetPlaceholder } from "@/components/ui/asset-placeholder";
import { BackLink } from "@/components/ui/back-link";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactAnnouncementButton } from "@/components/features/contact-announcement-button";
import { ReportButton } from "@/components/features/report-button";
import { formatRelativeTime } from "@/lib/utils/date";
import type { Announcement } from "@/lib/types";
import { PageStack } from "@/components/ui/page-stack";

const MapViewCommune = dynamic(
  () => import("@/components/features/map-view").then((m) => m.MapViewCommune),
  { loading: () => <div className="h-48 animate-pulse rounded-3xl bg-warm" /> },
);

export default async function AnnonceDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const { data } = await supabase
    .from("announcements")
    .select(
      "*, author_membership:memberships!announcements_author_membership_id_fkey(address_street, address_city, user_id, profiles:profiles!memberships_profiles_user_id_fkey(display_name, first_name, last_name))",
    )
    .eq("id", id)
    .eq("commune_id", ctx.activeMembership!.commune_id)
    .single();

  if (!data) notFound();

  const ann = data as Announcement & {
    author_membership: {
      address_street: string | null;
      address_city: string | null;
      user_id: string;
      profiles: { display_name: string | null; first_name: string | null; last_name: string | null } | null;
    } | null;
  };

  const authorLocation =
    ann.author_membership?.address_street ??
    ann.author_membership?.address_city ??
    "Adresse non renseignée";

  const authorName =
    (ann.author_membership?.profiles?.display_name ??
      [ann.author_membership?.profiles?.first_name, ann.author_membership?.profiles?.last_name]
        .filter(Boolean)
        .join(" ")) || "Voisin·e";

  const isAuthor =
    ann.author_membership?.user_id === ctx.userId;
  const contactLabel =
    ann.type === "demande" ? "Je peux aider !" : `Contacter ${authorName.split(" ")[0]}`;

  return (
    <PageStack gap="5">
      <BackLink href={ROUTES.annonces.list}>← Toutes les annonces</BackLink>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="space-y-4 p-6 lg:col-span-2">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <AnnouncementTypeTag type={ann.type} />
                <CategoryTag
                  label={getCategoryLabel(ann.category_slug)}
                  colorHex={getCategoryColorHex(ann.category_slug)}
                />
              </div>
              <h1 className="text-[28px] font-bold leading-9 text-text">{ann.title}</h1>
              <p className="text-sm text-muted">
                {authorName} · {formatRelativeTime(ann.created_at)} ·{" "}
                {authorLocation}
              </p>
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
              description="Photo de l'annonce"
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

          {!isAuthor ? (
            <ContactAnnouncementButton contextId={ann.id} label={contactLabel} />
          ) : null}
        </Card>

        <aside className="space-y-4">
          <Card className="space-y-3 p-5">
            <h2 className="text-lg font-semibold text-text">Localisation</h2>
            <p className="text-sm text-muted">
              {authorLocation}
            </p>
            {ann.address_lat != null && ann.address_lng != null ? (
              <MapViewCommune
                latitude={ann.address_lat}
                longitude={ann.address_lng}
                communeName={ann.title}
                zoom={15}
                className="h-48 rounded-2xl overflow-hidden border border-border/70"
              />
            ) : null}
          </Card>

          <Suspense fallback={<SimilarAnnouncementsSkeleton />}>
            <SimilarAnnouncements
              communeId={ctx.activeMembership!.commune_id}
              categorySlug={ann.category_slug}
              excludeId={ann.id}
            />
          </Suspense>
        </aside>
      </div>
    </PageStack>
  );
}

async function SimilarAnnouncements({
  communeId,
  categorySlug,
  excludeId,
}: {
  communeId: string;
  categorySlug: string;
  excludeId: string;
}) {
  const supabase = await createClient();
  const similar = await listSimilarAnnouncements(
    supabase,
    communeId,
    categorySlug,
    excludeId,
  );

  if (similar.length === 0) return null;

  return (
    <Card className="space-y-3 p-5">
      <h2 className="text-lg font-semibold text-text">Annonces similaires</h2>
      <ul className="space-y-2">
        {similar.map((s) => (
          <li key={s.id}>
            <Link
              href={ROUTES.annonces.detail(s.id)}
              className="text-sm font-semibold text-purple hover:underline"
            >
              {s.title}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SimilarAnnouncementsSkeleton() {
  return (
    <Card className="space-y-3 p-5">
      <Skeleton className="h-6 w-40" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </Card>
  );
}
