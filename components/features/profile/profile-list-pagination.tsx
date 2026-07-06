"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ProfileTabKey } from "@/components/features/profile/profile-tabs";
import { Button } from "@/components/ui/button";
import { buildProfileListQuery } from "@/lib/utils/profile-list-params";
import { ROUTES } from "@/lib/constants/routes";

type Props = {
  tab: ProfileTabKey;
  page: number;
  totalCount: number;
  pageSize: number;
};

export function ProfileListPagination({
  tab,
  page,
  totalCount,
  pageSize,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalPages <= 1) return null;

  function navigate(nextPage: number) {
    startTransition(() => {
      router.push(
        `${ROUTES.profil}${buildProfileListQuery({ tab, page: nextPage })}`,
      );
    });
  }

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 pt-2 text-sm font-medium text-muted"
      aria-label="Pagination"
    >
      <Button
        type="button"
        variant="secondary"
        className="px-3 py-1.5 text-xs"
        disabled={page <= 1 || isPending}
        onClick={() => navigate(page - 1)}
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
        onClick={() => navigate(page + 1)}
      >
        Suivant
      </Button>
    </nav>
  );
}
