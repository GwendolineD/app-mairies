"use client";

import {
  PLATFORM_ADMIN_LABEL,
  ROLE_LABELS,
} from "@/lib/constants/roles";
import { cn } from "@/lib/utils/cn";
import type { MembershipRole } from "@/lib/types";

const ROLE_CLASS: Record<MembershipRole, string> = {
  member: "bg-soft-pink text-purple",
  staff: "bg-turquoise/15 text-aqua",
  mayor: "bg-purple/10 text-purple",
};

type Props = {
  role: MembershipRole;
  isPlatformAdmin?: boolean;
  className?: string;
};

export function MembershipRoleBadge({
  role,
  isPlatformAdmin = false,
  className,
}: Props) {
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
          ROLE_CLASS[role],
        )}
      >
        {ROLE_LABELS[role]}
      </span>
      {isPlatformAdmin ? (
        <span className="inline-flex items-center rounded-full bg-magenta/10 px-2.5 py-1 text-xs font-semibold text-magenta">
          {PLATFORM_ADMIN_LABEL}
        </span>
      ) : null}
    </span>
  );
}
