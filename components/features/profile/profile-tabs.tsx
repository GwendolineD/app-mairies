import Link from "next/link";
import {
  CalendarDays,
  HeartHandshake,
  LayoutGrid,
  Megaphone,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";

export const PROFILE_TABS = [
  { key: "annonces", label: "Annonces", icon: Megaphone },
  { key: "initiatives", label: "Initiatives", icon: LayoutGrid },
  { key: "evenements", label: "Événements", icon: CalendarDays },
  { key: "participations", label: "Participations", icon: HeartHandshake },
  { key: "parametres", label: "Paramètres", icon: Settings },
] as const;

export type ProfileTabKey = (typeof PROFILE_TABS)[number]["key"];

export function isProfileTab(value: string): value is ProfileTabKey {
  return PROFILE_TABS.some((tab) => tab.key === value);
}

function ProfileTabLink({
  tab,
  active,
}: {
  tab: { key: ProfileTabKey; label: string; icon: LucideIcon };
  active: boolean;
}) {
  const Icon = tab.icon;

  return (
    <Link
      href={`${ROUTES.profil}?tab=${tab.key}`}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-soft-pink text-purple"
          : "text-muted hover:bg-warm hover:text-text",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-4" aria-hidden />
      {tab.label}
    </Link>
  );
}

export function ProfileTabs({ activeTab }: { activeTab: ProfileTabKey }) {
  return (
    <nav
      className="flex gap-2 overflow-x-auto border-b border-border pb-3"
      aria-label="Sections du profil"
    >
      {PROFILE_TABS.map((tab) => (
        <ProfileTabLink key={tab.key} tab={tab} active={tab.key === activeTab} />
      ))}
    </nav>
  );
}
