"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildHabitantsListQuery,
  DEFAULT_HABITANTS_PAGE_SIZE,
  HABITANTS_PAGE_SIZES,
  type HabitantsListParams,
} from "@/lib/utils/habitants-list-params";

type Props = {
  params: HabitantsListParams;
  totalCount: number;
};

function pageSizeLabel(option: number) {
  return `${option} par page`;
}

export function HabitantsListPagination({ params, totalCount }: Props) {
  const pathname = usePathname();
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

  function navigate(partial: Partial<HabitantsListParams>) {
    startTransition(() => {
      router.push(
        `${pathname}${buildHabitantsListQuery({ ...params, ...partial })}`,
      );
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-sm font-medium text-muted">
      <Select
        items={HABITANTS_PAGE_SIZES.map((option) => ({
          value: String(option),
          label: pageSizeLabel(option),
        }))}
        value={String(limit)}
        onValueChange={(value) => {
          if (!value) return;
          navigate({ limit: Number(value), page: 1 });
        }}
      >
        <SelectTrigger className="min-w-28 rounded-sm max-md:h-10 max-md:py-2.5">
          <SelectValue />
        </SelectTrigger>
        <SelectContent side={selectSide} align="end">
          {HABITANTS_PAGE_SIZES.map((option) => (
            <SelectItem
              key={option}
              value={String(option)}
              className="max-md:py-2.5"
            >
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

export { DEFAULT_HABITANTS_PAGE_SIZE };
