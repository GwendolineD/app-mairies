import Link from "next/link";
import {
  CalendarDays,
  HeartHandshake,
  Megaphone,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";

export const PROFILE_TABS = [
  { key: "annonces", label: "Annonces", icon: Megaphone },
  { key: "initiatives", label: "Initiatives", icon: Sparkles },
  { key: "evenements", label: "Événements", icon: CalendarDays },
  {
    key: "participations",
    label: "Participations",
    icon: HeartHandshake,
    hidden: true,
  },
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
        "relative flex min-w-0 flex-1 flex-col items-center gap-1 px-1 pb-3 text-[10px] font-semibold leading-tight transition md:inline-flex md:shrink-0 md:flex-none md:flex-row md:gap-2 md:px-1 md:text-sm md:leading-normal",
        active
          ? "text-magenta after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-magenta"
          : "text-text hover:text-purple",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-5 shrink-0 md:size-4" aria-hidden />
      <span className="w-full truncate text-center md:w-auto md:truncate">{tab.label}</span>
    </Link>
  );
}

export function ProfileTabs({ activeTab }: { activeTab: ProfileTabKey }) {
  return (
    <nav
      className="mt-2.5 flex w-full gap-0 border-b border-border md:w-auto md:gap-8"
      aria-label="Sections du profil"
    >
      {PROFILE_TABS.filter((tab) => !("hidden" in tab && tab.hidden)).map((tab) => (
        <ProfileTabLink key={tab.key} tab={tab} active={tab.key === activeTab} />
      ))}
    </nav>
  );
}
