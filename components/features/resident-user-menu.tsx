"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
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

      <DropdownMenuContent align="end" sideOffset={8} className="min-w-44">
        <DropdownMenuItem
          className="font-semibold"
          render={<Link href={ROUTES.profil} className="w-full" />}
        >
          Mon profil
        </DropdownMenuItem>
        {backofficeLinks.map((link) => (
          <DropdownMenuItem
            key={link.id}
            className="font-semibold"
            render={<Link href={link.href} className="w-full" />}
          >
            {link.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="font-semibold"
          onClick={() => {
            void signOut();
          }}
        >
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
