"use client";

import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  buildReportListQuery,
  type ReportListParams,
} from "@/lib/utils/report-list-params";

type Props = {
  params: ReportListParams;
};

export function ReportSearch({ params }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState(params.q);

  useEffect(() => {
    setSearch(params.q);
  }, [params.q]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const trimmed = search.trim();
      if (trimmed === params.q) return;
      router.push(
        `${pathname}${buildReportListQuery({ ...params, q: trimmed })}`,
      );
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search, params, pathname, router]);

  function clearSearch() {
    setSearch("");
    router.push(`${pathname}${buildReportListQuery({ ...params, q: "" })}`);
  }

  return (
    <div className="relative w-full max-w-xs min-w-[200px] flex-1 sm:flex-none">
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Rechercher par titre…"
        aria-label="Rechercher par titre"
        className="h-10 py-0 pr-9 text-sm placeholder:text-xs md:h-8 md:py-1 md:text-base md:placeholder:text-sm"
      />
      {search ? (
        <button
          type="button"
          onClick={clearSearch}
          className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted hover:text-text"
          aria-label="Effacer la recherche"
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
