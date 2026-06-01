"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown, MapPin, Plus } from "lucide-react";
import { JoinCommuneModal } from "@/components/features/join-commune-modal";
import { switchCommune } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Membership } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  memberships: Membership[];
  activeCommuneId: string | null | undefined;
  className?: string;
};

function membershipLabel(m: Membership) {
  const name = m.commune?.name ?? "Commune";
  if (m.status === "suspended") return `${name} (suspendue)`;
  if (m.status !== "active") return `${name} (inactive)`;
  return name;
}

const HEADER_TRIGGER_CLASS =
  "h-11 max-w-[min(100vw-8rem,280px)] shrink-0 justify-start gap-2 rounded-xl px-3 font-semibold";

export function CommuneSwitcher({
  memberships,
  activeCommuneId,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [busy, run] = useTransition();

  const activeMembership =
    memberships.find((m) => m.commune_id === activeCommuneId) ??
    memberships.find((m) => m.status === "active");

  const activeName = activeMembership
    ? membershipLabel(activeMembership)
    : "Choisir ma commune";

  const selectable = memberships.filter(
    (m) => m.status === "active" || m.status === "suspended",
  );

  function selectCommune(communeId: string) {
    setOpen(false);
    run(() => {
      void switchCommune(communeId);
    });
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              className={cn(HEADER_TRIGGER_CLASS, className)}
            />
          }
        >
          <MapPin className="size-4 shrink-0 text-purple" aria-hidden />
          <span className="min-w-0 truncate">{activeName}</span>
          <ChevronDown className="ml-auto size-4 shrink-0 text-muted" aria-hidden />
        </PopoverTrigger>

        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-[min(calc(100vw-2rem),320px)] gap-0 p-0"
        >
          <div className="border-b border-border/60 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Mes communes
            </p>
          </div>

          <ul
            className="max-h-[270px] overflow-y-auto py-1"
            role="listbox"
            aria-label="Communes adhérées"
          >
            {selectable.length === 0 ? (
              <li className="px-3 py-4 text-sm text-muted">
                Aucune commune active pour le moment.
              </li>
            ) : (
              selectable.map((m) => {
                const isActive = m.commune_id === activeCommuneId;
                const disabled = m.status !== "active" && m.status !== "suspended";
                return (
                  <li key={m.id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      disabled={disabled || busy}
                      onClick={() => selectCommune(m.commune_id)}
                      className={cn(
                        "flex h-[54px] w-full cursor-pointer items-center gap-3 px-3 text-left text-sm transition hover:bg-warm disabled:cursor-not-allowed disabled:opacity-50",
                        isActive && "bg-soft-pink/70",
                      )}
                    >
                      <MapPin
                        className={cn(
                          "size-4 shrink-0",
                          isActive ? "text-purple" : "text-muted",
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate font-medium text-text">
                        {membershipLabel(m)}
                      </span>
                      {isActive ? (
                        <Check className="size-4 shrink-0 text-purple" aria-hidden />
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          <div className="border-t border-border/60 p-2">
            <Button
              type="button"
              variant="ghost"
              className="h-[54px] w-full justify-start gap-2 px-3 text-sm font-semibold text-purple"
              onClick={() => {
                setOpen(false);
                setJoinOpen(true);
              }}
            >
              <Plus className="size-4 shrink-0" aria-hidden />
              Adhérer à une autre commune
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <JoinCommuneModal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        existingMemberships={memberships}
      />
    </>
  );
}
