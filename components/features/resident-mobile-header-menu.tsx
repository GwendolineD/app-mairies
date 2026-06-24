"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Check,
  LampDesk,
  Landmark,
  LogOut,
  MapPin,
  Plus,
  User,
  type LucideIcon,
} from "lucide-react";
import { JoinCommuneModal } from "@/components/features/join-commune-modal";
import { AssistanceModal } from "@/components/features/assistance/assistance-modal";
import { AssistanceTrigger } from "@/components/features/assistance/assistance-trigger";
import { switchCommune, signOut } from "@/lib/actions/auth";
import type { BackofficeNavLink } from "@/lib/auth/permissions";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Membership, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

const USER_MENU_ITEM_ICONS: Record<string, LucideIcon> = {
  "Mon profil": User,
  "Espace mairie": Landmark,
  Backoffice: LampDesk,
};

type Props = {
  profile: Pick<Profile, "first_name" | "display_name" | "avatar_url">;
  memberships: Membership[];
  activeCommuneId: string | null | undefined;
  backofficeLinks?: BackofficeNavLink[];
  supportEmail: string;
};

function firstName(profile: Props["profile"]) {
  if (profile.first_name?.trim()) return profile.first_name.trim();
  const fromDisplay = profile.display_name?.trim().split(/\s+/)[0];
  return fromDisplay || "Profil";
}

function initials(profile: Props["profile"]) {
  const name = firstName(profile);
  return name.slice(0, 1).toUpperCase();
}

function membershipLabel(m: Membership) {
  const name = m.commune?.name ?? "Commune";
  if (m.status === "suspended") return `${name} (suspendue)`;
  if (m.status !== "active") return `${name} (inactive)`;
  return name;
}

export function ResidentMobileHeaderMenu({
  profile,
  memberships,
  activeCommuneId,
  backofficeLinks = [],
  supportEmail,
}: Props) {
  const [open, setOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [assistanceOpen, setAssistanceOpen] = useState(false);
  const [busy, run] = useTransition();

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
              className="size-11 shrink-0 rounded-xl p-0"
              aria-label={`Menu — ${firstName(profile)}`}
            />
          }
        >
          <span className="relative flex size-9 items-center justify-center overflow-hidden rounded-full bg-soft-pink text-sm font-bold text-purple">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt=""
                width={36}
                height={36}
                className="size-full object-cover"
              />
            ) : (
              initials(profile)
            )}
          </span>
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
                        "flex h-10 w-full cursor-pointer items-center gap-3 px-3 text-left text-sm transition hover:bg-warm disabled:cursor-not-allowed disabled:opacity-50",
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

          <div className="border-t border-border/60 p-1">
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full justify-start gap-2 px-3 text-sm font-semibold text-purple"
              onClick={() => {
                setOpen(false);
                setJoinOpen(true);
              }}
            >
              <Plus className="size-4 shrink-0" aria-hidden />
              Adhérer à une autre commune
            </Button>
          </div>

          <div className="border-t border-border/60 py-1">
            <Link
              href={ROUTES.profil}
              onClick={() => setOpen(false)}
              className="flex h-10 w-full cursor-pointer items-center gap-2.5 px-3 text-sm font-semibold text-text transition hover:bg-warm"
            >
              <User className="size-4 shrink-0 text-muted" aria-hidden />
              Mon profil
            </Link>
            <AssistanceTrigger
              variant="menu"
              onOpen={() => {
                setOpen(false);
                setAssistanceOpen(true);
              }}
            />
            {backofficeLinks.map((link) => {
              const Icon = USER_MENU_ITEM_ICONS[link.label] ?? LampDesk;
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-full cursor-pointer items-center gap-2.5 px-3 text-sm font-semibold text-text transition hover:bg-warm"
                >
                  <Icon className="size-4 shrink-0 text-muted" aria-hidden />
                  {link.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
              className="flex h-10 w-full cursor-pointer items-center gap-2.5 px-3 text-sm font-semibold text-coral transition hover:bg-warm"
            >
              <LogOut className="size-4 shrink-0" aria-hidden />
              Se déconnecter
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <JoinCommuneModal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        existingMemberships={memberships}
      />

      <AssistanceModal
        open={assistanceOpen}
        onClose={() => setAssistanceOpen(false)}
        supportEmail={supportEmail}
      />
    </>
  );
}
