"use client";

import { Mail, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { GlobalUserStats } from "@/lib/queries/backoffice-users-list.types";
import { cn } from "@/lib/utils/cn";

type UtilisateursStatsBarProps = {
  counts: GlobalUserStats;
};

export function UtilisateursStatsBar({ counts }: UtilisateursStatsBarProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="flex flex-col gap-1 rounded-xl border-purple/25 bg-purple/5 p-3 md:p-4">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-muted">
          <Users className="size-3.5 shrink-0 text-purple" aria-hidden />
          Total inscrits
        </p>
        <p className={cn("font-bold text-xl text-purple md:text-3xl")}>
          {counts.totalUsers}
        </p>
      </Card>

      <Card className="flex flex-col gap-1 rounded-xl border-orange/25 bg-orange/5 p-3 md:p-4">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-muted">
          <Mail className="size-3.5 shrink-0 text-orange" aria-hidden />
          Invitations en cours
        </p>
        <p className={cn("font-bold text-xl text-orange md:text-3xl")}>
          {counts.pendingInvitations}
        </p>
      </Card>
    </div>
  );
}
