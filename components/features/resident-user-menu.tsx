"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  LampDesk,
  Landmark,
  LogOut,
  User,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import type { BackofficeNavLink } from "@/lib/auth/permissions";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

const HEADER_TRIGGER_CLASS =
  "h-11 max-w-[min(100vw-10rem,220px)] shrink-0 gap-2 rounded-xl px-3 font-semibold";

const USER_MENU_ITEM_ICONS: Record<string, LucideIcon> = {
  "Mon profil": User,
  "Espace mairie": Landmark,
  Backoffice: LampDesk,
};

const MENU_ITEM_CLASS =
  "h-10 w-full gap-2.5 rounded-none px-3 font-semibold";

type Props = {
  profile: Pick<Profile, "first_name" | "display_name" | "avatar_url">;
  backofficeLinks?: BackofficeNavLink[];
  className?: string;
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

export function ResidentUserMenu({
  profile,
  backofficeLinks = [],
  className,
}: Props) {
  const label = firstName(profile);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            className={cn(HEADER_TRIGGER_CLASS, className)}
          />
        }
      >
        <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-soft-pink text-sm font-bold text-purple">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt=""
              width={32}
              height={32}
              className="size-full object-cover"
            />
          ) : (
            initials(profile)
          )}
        </span>
        <span className="hidden min-w-0 truncate sm:inline">{label}</span>
        <ChevronDown className="ml-auto size-4 shrink-0 text-muted" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-44 overflow-hidden rounded-sm p-0"
      >
        <DropdownMenuItem
          className={MENU_ITEM_CLASS}
          render={<Link href={ROUTES.profil} className="flex w-full items-center gap-2.5" />}
        >
          <User className="size-4 shrink-0 text-muted" aria-hidden />
          Mon profil
        </DropdownMenuItem>
        {backofficeLinks.map((link) => {
          const Icon = USER_MENU_ITEM_ICONS[link.label] ?? LampDesk;
          return (
            <DropdownMenuItem
              key={link.id}
              className={MENU_ITEM_CLASS}
              render={
                <Link
                  href={link.href}
                  className="flex w-full items-center gap-2.5"
                />
              }
            >
              <Icon className="size-4 shrink-0 text-muted" aria-hidden />
              {link.label}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator className="my-0" />
        <DropdownMenuItem
          variant="destructive"
          className={MENU_ITEM_CLASS}
          onClick={() => {
            void signOut();
          }}
        >
          <LogOut className="size-4 shrink-0" aria-hidden />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
