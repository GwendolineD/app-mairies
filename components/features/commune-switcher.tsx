"use client";

import { useTransition } from "react";
import { switchCommune } from "@/lib/actions/auth";
import type { Membership } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  memberships: Membership[];
  activeCommuneId: string | null | undefined;
  className?: string;
};

export function CommuneSwitcher({
  memberships,
  activeCommuneId,
  className,
}: Props) {
  const [busy, run] = useTransition();

  return (
    <label className={cn("flex flex-col gap-1", className)}>
      <span className="sr-only">Changer de commune</span>
      <select
        className={cn(
          "max-w-full truncate rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-text outline-none focus:border-purple",
          busy ? "opacity-60" : "",
        )}
        value={activeCommuneId ?? ""}
        disabled={busy}
        onChange={(ev) =>
          run(() => {
            void switchCommune(ev.target.value);
          })
        }
      >
        <option disabled value="">
          Choisir ma commune principale…
        </option>
        {memberships.map((m) => {
          const communeName = m.commune?.name ?? "Commune";
          const subtitle =
            m.status === "suspended"
              ? " (suspendue)"
              : m.status !== "active"
                ? " (inactive)"
                : "";
          return (
            <option
              key={m.id}
              value={m.commune_id}
              disabled={m.status !== "active" && m.status !== "suspended"}
            >
              {communeName}
              {subtitle}
            </option>
          );
        })}
      </select>
    </label>
  );
}
