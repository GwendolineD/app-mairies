"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatStreetDisplay } from "@/lib/ban/display";
import { getInitiativeCategoryLabel } from "@/lib/constants/initiative-categories";
import { ROUTES } from "@/lib/constants/routes";
import type { InitiativeWithAuthor } from "@/lib/queries/initiatives";
import { INITIATIVES_PAGE_SIZE } from "@/lib/queries/initiatives";
import {
  buildInitiativeListQuery,
  type InitiativeListParams,
} from "@/lib/utils/search-params";
import { ContentTypeTag } from "@/components/ui/content-type-tag";
import { Card } from "@/components/ui/card";
import { ListGrid, PageStack } from "@/components/ui/page-stack";
import { PageHeading } from "@/components/ui/page-heading";
import { Button } from "@/components/ui/button";
import { useCreationModals } from "@/components/features/creation-modal-context";
import { formatRelativeTime } from "@/lib/utils/date";
import { INITIATIVE_CATEGORIES } from "@/lib/constants/initiative-categories";
import { cn } from "@/lib/utils/cn";
import dynamic from "next/dynamic";
import { getInitiativePinHex } from "@/lib/constants/map-pins";

const MapContentView = dynamic(
  () =>
    import("@/components/features/map-content-view").then((m) => m.MapContentView),
  { ssr: false, loading: () => <Card className="h-[420px] animate-pulse bg-warm" /> },
);

type Props = {
  params: InitiativeListParams;
  items: InitiativeWithAuthor[];
  totalCount: number;
  mapCenter: [number, number];
  mapMarkers: { id: string; title: string; categorySlug: string; lat: number; lng: number }[];
};

export function InitiativesPageClient({
  params,
  items,
  totalCount,
  mapCenter,
  mapMarkers,
}: Props) {
  const router = useRouter();
  const { openInitiativeModal } = useCreationModals();
  const pathname = ROUTES.initiatives.list;

  function navigate(partial: Partial<InitiativeListParams>) {
    router.push(`${pathname}${buildInitiativeListQuery({ ...params, ...partial, page: 1 })}`);
  }

  const markers = mapMarkers.map((m) => ({
    ...m,
    pinColor: getInitiativePinHex(m.categorySlug),
  }));

  return (
    <PageStack>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <PageHeading
          title="Toutes les initiatives"
          subtitle="Projets civiques et coopérations locales."
        />
        <Button type="button" onClick={() => openInitiativeModal()}>
          + Lancer une initiative
        </Button>
      </header>

      <div className="flex flex-wrap gap-2">
        <ViewToggle active={params.vue === "liste"} onClick={() => navigate({ vue: "liste" })} label="Liste" />
        <ViewToggle active={params.vue === "carte"} onClick={() => navigate({ vue: "carte" })} label="Carte" />
        <span className="self-center text-sm text-muted">
          {totalCount} initiative{totalCount !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterChip active={!params.categorie} onClick={() => navigate({ categorie: undefined })} label="Toutes" />
        {INITIATIVE_CATEGORIES.map((c) => (
          <FilterChip
            key={c.slug}
            active={params.categorie === c.slug}
            onClick={() =>
              navigate({ categorie: params.categorie === c.slug ? undefined : c.slug })
            }
            label={c.label}
          />
        ))}
      </div>

      {params.vue === "carte" ? (
        <MapContentView markers={markers} center={mapCenter} carouselItems={[]} />
      ) : items.length === 0 ? (
        <Card className="p-5 text-center text-sm text-muted">Aucune initiative pour le moment.</Card>
      ) : (
        <ListGrid>
          {items.map((item) => (
            <Link href={ROUTES.initiatives.detail(item.id)} key={item.id} className="h-full">
              <Card className="flex h-full flex-col space-y-2 p-5 transition hover:border-purple/45">
                <ContentTypeTag type="initiative" />
                {item.category_slug ? (
                  <p className="text-xs font-semibold text-mint">
                    {getInitiativeCategoryLabel(item.category_slug)}
                  </p>
                ) : null}
                <h3 className="text-xl font-semibold text-text">{item.title}</h3>
                {item.description ? (
                  <p className="line-clamp-2 text-sm text-muted">{item.description}</p>
                ) : null}
                <p className="mt-auto text-xs text-subtle">
                  {formatStreetDisplay(item.address_label ?? item.author_membership?.address_label)} ·{" "}
                  {formatRelativeTime(item.created_at)}
                </p>
              </Card>
            </Link>
          ))}
        </ListGrid>
      )}
    </PageStack>
  );
}

function ViewToggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-sm px-3 py-1.5 text-xs font-semibold",
        active ? "bg-soft-pink text-purple" : "border border-border text-muted",
      )}
    >
      {label}
    </button>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold",
        active ? "bg-soft-pink text-purple" : "border border-border text-muted",
      )}
    >
      {label}
    </button>
  );
}
