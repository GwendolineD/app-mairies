"use client";

import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/constants/routes";

type Props = {
  initialQuery: string;
};

export function HabitantsSearch({ initialQuery }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState(initialQuery);

  useEffect(() => {
    setSearch(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search === initialQuery) return;
      const sp = new URLSearchParams();
      if (search.trim()) sp.set("q", search.trim());
      const qs = sp.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ""}`);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search, initialQuery, pathname, router]);

  function clearSearch() {
    setSearch("");
    router.push(ROUTES.mairie.habitants);
  }

  return (
    <div className="relative w-full max-w-xs">
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Rechercher par nom ou prénom…"
        aria-label="Rechercher par nom ou prénom"
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
