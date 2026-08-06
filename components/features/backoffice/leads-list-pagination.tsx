"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildLeadsListQuery,
  LEADS_PAGE_SIZE,
  LEADS_PAGE_SIZES,
  type LeadsListParams,
} from "@/lib/utils/backoffice-leads-params";

type Props = {
  params: LeadsListParams;
  totalCount: number;
  basePath: string;
};

function pageSizeLabel(option: number) {
  return `${option} par page`;
}

export function LeadsListPagination({ params, totalCount, basePath }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectSide, setSelectSide] = useState<"top" | "bottom">("bottom");

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setSelectSide(media.matches ? "top" : "bottom");
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const page = params.page;
  const limit = params.limit;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  function navigate(partial: Partial<LeadsListParams>) {
    startTransition(() => {
      router.push(`${basePath}${buildLeadsListQuery({ ...params, ...partial })}`);
    });
  }

  if (totalCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-sm font-medium text-muted">
      <Select
        items={LEADS_PAGE_SIZES.map((option) => ({
          value: String(option),
          label: pageSizeLabel(option),
        }))}
        value={String(limit)}
        onValueChange={(value) => {
          if (!value) return;
          navigate({ limit: Number(value), page: 1 });
        }}
      >
        <SelectTrigger className="min-w-28 rounded-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent side={selectSide} align="end">
          {LEADS_PAGE_SIZES.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {pageSizeLabel(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {totalPages > 1 ? (
        <nav className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            disabled={page <= 1 || isPending}
            onClick={() => navigate({ page: page - 1 })}
          >
            Précédent
          </Button>
          <span>
            Page {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            disabled={page >= totalPages || isPending}
            onClick={() => navigate({ page: page + 1 })}
          >
            Suivant
          </Button>
        </nav>
      ) : null}
    </div>
  );
}

export { LEADS_PAGE_SIZE };
