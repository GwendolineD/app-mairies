"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/constants/announcement-categories";
import { ANNOUNCEMENT_TYPES } from "@/lib/constants/announcement-types";
import {
  buildAnnouncementListQuery,
  type AnnouncementListParams,
} from "@/lib/utils/search-params";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type Props = {
  params: AnnouncementListParams;
  totalCount: number;
  onCreateClick?: () => void;
};

export function AnnouncementListToolbar({
  params,
  totalCount,
  onCreateClick,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function navigate(partial: Partial<AnnouncementListParams>) {
    const next = { ...params, ...partial, page: partial.page ?? 1 };
    router.push(`${pathname}${buildAnnouncementListQuery(next)}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted">
          {totalCount} annonce{totalCount !== 1 ? "s" : ""} trouvée
          {totalCount !== 1 ? "s" : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={params.vue === "liste" ? "primary" : "secondary"}
            className="px-3 py-1.5 text-xs"
            onClick={() => navigate({ vue: "liste" })}
          >
            Liste
          </Button>
          <Button
            type="button"
            variant={params.vue === "carte" ? "primary" : "secondary"}
            className="px-3 py-1.5 text-xs"
            onClick={() => navigate({ vue: "carte" })}
          >
            Carte
          </Button>
          {onCreateClick ? (
            <Button type="button" className="px-3 py-1.5 text-xs" onClick={onCreateClick}>
              + Créer
            </Button>
          ) : (
            <Button
              href={`${pathname}${buildAnnouncementListQuery({ ...params, create: "annonce" })}`}
              className="px-3 py-1.5 text-xs"
            >
              + Créer
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterChip
          active={!params.type}
          onClick={() => navigate({ type: undefined })}
          label="Tous types"
        />
        {ANNOUNCEMENT_TYPES.map((t) => (
          <FilterChip
            key={t.slug}
            active={params.type === t.slug}
            onClick={() =>
              navigate({ type: params.type === t.slug ? undefined : t.slug })
            }
            label={t.label}
          />
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterChip
          active={!params.categorie}
          onClick={() => navigate({ categorie: undefined })}
          label="Toutes catégories"
        />
        {ANNOUNCEMENT_CATEGORIES.map((c) => (
          <FilterChip
            key={c.slug}
            active={params.categorie === c.slug}
            onClick={() =>
              navigate({
                categorie: params.categorie === c.slug ? undefined : c.slug,
              })
            }
            label={c.label}
          />
        ))}
      </div>
    </div>
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
        "shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "bg-soft-pink text-purple"
          : "border border-border bg-surface text-muted hover:text-text",
      )}
    >
      {label}
    </button>
  );
}

export function AnnouncementPagination({
  params,
  totalCount,
  pageSize,
}: {
  params: AnnouncementListParams;
  totalCount: number;
  pageSize: number;
}) {
  const pathname = usePathname();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalPages <= 1) return null;

  return (
    <nav className="hidden items-center justify-center gap-2 md:flex">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Link
          key={page}
          href={`${pathname}${buildAnnouncementListQuery({ ...params, page })}`}
          className={cn(
            "cursor-pointer rounded-sm px-3 py-1.5 text-sm font-semibold",
            page === params.page
              ? "bg-soft-pink text-purple"
              : "text-muted hover:text-text",
          )}
        >
          {page}
        </Link>
      ))}
    </nav>
  );
}
