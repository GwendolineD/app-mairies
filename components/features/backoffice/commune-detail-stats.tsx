import {
  CalendarDays,
  Megaphone,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

type Props = {
  activeMembersCount: number;
  activeAnnouncementsCount: number;
  activeInitiativesCount: number;
  activeEventsCount: number;
  totalAnnouncementsCount: number;
  totalInitiativesCount: number;
  totalEventsCount: number;
};

function pluralActiveMembers(count: number): string {
  return count <= 1 ? "actif" : "actifs";
}

function pluralActiveContent(count: number): string {
  return count <= 1 ? "active" : "actives";
}

function pluralCreated(count: number): string {
  return count <= 1 ? "créée" : "créées";
}

function MemberStatCard({ count }: { count: number }) {
  return (
    <Card className="space-y-1 rounded-xl p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-muted">
        <User className="size-3.5 shrink-0 text-subtle" aria-hidden />
        Adhérent·es
      </p>
      <div className="flex items-baseline gap-1.5">
        <p className="font-bold text-2xl text-purple md:text-3xl">{count}</p>
        <p className="text-xs font-medium text-muted">
          {pluralActiveMembers(count)}
        </p>
      </div>
    </Card>
  );
}

function ContentStatCard({
  label,
  icon: Icon,
  activeCount,
  totalCount,
  activeColorClass,
}: {
  label: string;
  icon: LucideIcon;
  activeCount: number;
  totalCount: number;
  activeColorClass: string;
}) {
  return (
    <Card className="space-y-1 rounded-xl p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-muted">
        <Icon className="size-3.5 shrink-0 text-subtle" aria-hidden />
        {label}
      </p>
      <div className="flex items-baseline gap-1.5">
        <p className={cn("font-bold text-2xl md:text-3xl", activeColorClass)}>
          {activeCount}
        </p>
        <p className="text-xs font-medium text-muted">
          {pluralActiveContent(activeCount)}
        </p>
      </div>
      <p className="text-sm font-medium text-muted">
        {totalCount} {pluralCreated(totalCount)}
      </p>
    </Card>
  );
}

export function CommuneDetailStats({
  activeMembersCount,
  activeAnnouncementsCount,
  activeInitiativesCount,
  activeEventsCount,
  totalAnnouncementsCount,
  totalInitiativesCount,
  totalEventsCount,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MemberStatCard count={activeMembersCount} />
      <ContentStatCard
        label="Annonces"
        icon={Megaphone}
        activeCount={activeAnnouncementsCount}
        totalCount={totalAnnouncementsCount}
        activeColorClass="text-coral"
      />
      <ContentStatCard
        label="Initiatives"
        icon={Sparkles}
        activeCount={activeInitiativesCount}
        totalCount={totalInitiativesCount}
        activeColorClass="text-mint"
      />
      <ContentStatCard
        label="Événements"
        icon={CalendarDays}
        activeCount={activeEventsCount}
        totalCount={totalEventsCount}
        activeColorClass="text-orange"
      />
    </div>
  );
}
