"use client";

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

export function HabitantsListPagination({ params, totalCount }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
          label: `${option} / page`,
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
        <SelectContent>
          {HABITANTS_PAGE_SIZES.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option} / page
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
