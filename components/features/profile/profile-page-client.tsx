"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  MapPin,
  Pencil,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageStack } from "@/components/ui/page-stack";
import { AnnouncementTypeTag } from "@/components/ui/announcement-type-tag";
import { CategoryTag } from "@/components/ui/category-tag";
import { getCategoryLabel } from "@/lib/constants/announcement-categories";
import { ROUTES } from "@/lib/constants/routes";
import { ProfileTabs, type ProfileTabKey } from "@/components/features/profile/profile-tabs";
import { ProfileEmptyState } from "@/components/features/profile/profile-empty-state";
import { ProfilEditModal } from "@/components/features/profile/profil-edit-modal";
import { NeighborInviteBlock } from "@/components/features/profile/neighbor-invite-block";
import { NotificationPreferencesForm } from "@/components/features/notification-preferences-form";
import { ProfilAddCommuneButton } from "@/components/features/profil-add-commune-button";
import type {
  Announcement,
  InitiativeRecord,
  AgendaEventRecord,
  Membership,
  NotificationPreferences,
} from "@/lib/types";
import type { NeighborInviteTemplateView } from "@/lib/utils/email-template";
import { formatEventRange } from "@/lib/utils/date";

type ProfileData = {
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  bio: string;
  avatarUrl: string | null;
};

type MembershipData = {
  fullAddress: string;
  communeName: string;
  joinedAt: string;
  totalAnnouncements: number;
  totalInitiatives: number;
  totalEvents: number;
  role: string;
};

type InviteData = {
  template: NeighborInviteTemplateView;
  senderName: string;
  communeName: string;
  inviteCount: number;
};

type SettingsData = {
  notificationPrefs: NotificationPreferences;
  pushPublicKey: string | null;
  memberships: Membership[];
};

type Props = {
  profile: ProfileData;
  membership: MembershipData;
  activeTab: ProfileTabKey;
  announcements: Announcement[];
  initiatives: InitiativeRecord[];
  events: AgendaEventRecord[];
  invite: InviteData;
  settings: SettingsData;
};

export function ProfilePageClient({
  profile,
  membership,
  activeTab,
  announcements,
  initiatives,
  events,
  invite,
  settings,
}: Props) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <PageStack gap="5">
      <ProfileHero
        profile={profile}
        membership={membership}
        onEdit={() => setEditOpen(true)}
      />

      <ProfileTabs activeTab={activeTab} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          {activeTab === "annonces" && (
            <AnnouncementsPanel announcements={announcements} />
          )}
          {activeTab === "initiatives" && (
            <InitiativesPanel initiatives={initiatives} />
          )}
          {activeTab === "evenements" && (
            <EventsPanel events={events} />
          )}
          {activeTab === "participations" && <ParticipationsPlaceholder />}
          {activeTab === "parametres" && (
            <SettingsPanel settings={settings} />
          )}
        </section>

        <aside className="space-y-5">
          <NeighborInviteBlock
            template={invite.template}
            senderName={invite.senderName}
            communeName={invite.communeName}
            inviteCount={invite.inviteCount}
          />
        </aside>
      </div>

      <ProfilEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        displayName={profile.displayName}
        bio={profile.bio}
        avatarUrl={profile.avatarUrl}
        firstName={profile.firstName}
        lastName={profile.lastName}
      />
    </PageStack>
  );
}

function ProfileHero({
  profile,
  membership,
  onEdit,
}: {
  profile: ProfileData;
  membership: MembershipData;
  onEdit: () => void;
}) {
  const initials = profile.displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <Card className="overflow-hidden p-0">
      <div className="h-24 gradient-hero opacity-80" />
      <div className="flex flex-col gap-5 p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="-mt-16 flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex size-28 items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-soft-pink text-3xl font-bold text-purple shadow-card">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt=""
                width={112}
                height={112}
                unoptimized
                className="size-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-[28px] font-bold leading-9 text-text">
                {profile.displayName}
              </h1>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onEdit}
                className="hidden md:inline-flex"
              >
                <Pencil className="size-3.5" aria-hidden />
                Éditer mon profil
              </Button>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-semibold text-muted">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4" aria-hidden />
                {membership.fullAddress}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-4" aria-hidden />
                Membre depuis {formatMonthYear(membership.joinedAt)}
              </span>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onEdit}
              className="md:hidden"
            >
              <Pencil className="size-3.5" aria-hidden />
              Éditer mon profil
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 md:w-80">
          <ProfileStat label="Annonces" value={membership.totalAnnouncements} sublabel="publiées" />
          <ProfileStat label="Initiatives" value={membership.totalInitiatives} sublabel="organisées" />
          <ProfileStat label="Événements" value={membership.totalEvents} sublabel="créés" />
        </div>
      </div>
    </Card>
  );
}

function ProfileStat({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: number;
  sublabel?: string;
}) {
  return (
    <div className="rounded-2xl bg-warm px-3 py-4 text-center">
      <p className="text-xl font-bold leading-7 text-text">{value}</p>
      <p className="text-xs font-semibold text-muted">{label}</p>
      {sublabel && (
        <p className="text-[10px] font-medium text-subtle">{sublabel}</p>
      )}
    </div>
  );
}

function AnnouncementsPanel({ announcements }: { announcements: Announcement[] }) {
  const router = useRouter();

  if (announcements.length === 0) {
    return (
      <ProfileEmptyState
        title="Aucune annonce en cours"
        description="Publiez une annonce pour proposer ou demander de l'aide à vos voisins."
        action={
          <Button
            type="button"
            onClick={() => router.push(`${ROUTES.annonces.list}?create=annonce`)}
          >
            <Plus className="size-4" aria-hidden />
            Publier une annonce
          </Button>
        }
      />
    );
  }

  return (
    <Card className="space-y-4 p-5">
      <h2 className="text-xl font-semibold leading-7 text-text">
        Mes annonces en cours
      </h2>
      <div className="space-y-3">
        {announcements.map((a) => (
          <Link key={a.id} href={ROUTES.annonces.detail(a.id)}>
            <div className="rounded-2xl border border-border p-4 transition hover:border-purple/40">
              <div className="flex flex-wrap gap-2">
                <AnnouncementTypeTag type={a.type} />
                <CategoryTag label={getCategoryLabel(a.category_slug)} />
              </div>
              <p className="mt-2 text-base font-semibold leading-6 text-text">
                {a.title}
              </p>
              <p className="mt-1 text-xs font-semibold text-muted">
                {a.status} · {formatRelativeDate(a.created_at)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function InitiativesPanel({ initiatives }: { initiatives: InitiativeRecord[] }) {
  const router = useRouter();

  if (initiatives.length === 0) {
    return (
      <ProfileEmptyState
        title="Aucune initiative en cours"
        description="Lancez une initiative pour fédérer vos voisins autour d'un projet commun."
        action={
          <Button
            type="button"
            onClick={() => router.push(`${ROUTES.initiatives.list}?create=initiative`)}
          >
            <Plus className="size-4" aria-hidden />
            Lancer une initiative
          </Button>
        }
      />
    );
  }

  return (
    <Card className="space-y-4 p-5">
      <h2 className="text-xl font-semibold leading-7 text-text">
        Mes initiatives en cours
      </h2>
      <div className="space-y-3">
        {initiatives.map((i) => (
          <Link key={i.id} href={ROUTES.initiatives.detail(i.id)}>
            <div className="rounded-2xl border border-border p-4 transition hover:border-mint/60">
              <p className="text-base font-semibold leading-6 text-text">
                {i.title}
              </p>
              <p className="mt-1 line-clamp-2 text-sm font-medium leading-5 text-muted">
                {i.description ?? "Invitation ouverte à la commune."}
              </p>
              <p className="mt-2 text-xs font-semibold text-muted">
                {formatRelativeDate(i.created_at)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function EventsPanel({ events }: { events: AgendaEventRecord[] }) {
  const router = useRouter();

  if (events.length === 0) {
    return (
      <ProfileEmptyState
        title="Aucun événement en cours"
        description="Créez un événement pour rassembler vos voisins autour d'un moment convivial."
        action={
          <Button
            type="button"
            onClick={() => router.push(ROUTES.evenements.list)}
          >
            <Plus className="size-4" aria-hidden />
            Créer un événement
          </Button>
        }
      />
    );
  }

  return (
    <Card className="space-y-4 p-5">
      <h2 className="text-xl font-semibold leading-7 text-text">
        Mes événements en cours
      </h2>
      <div className="space-y-3">
        {events.map((e) => (
          <Link key={e.id} href={ROUTES.evenements.detail(e.id)}>
            <div className="rounded-2xl border border-border p-4 transition hover:border-orange/60">
              <p className="text-base font-semibold leading-6 text-text">
                {e.title}
              </p>
              <p className="mt-1 text-sm font-medium leading-5 text-muted">
                {formatEventRange(e.starts_at, e.ends_at)}
              </p>
              <p className="mt-2 text-xs font-semibold text-muted">
                {formatRelativeDate(e.created_at)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function ParticipationsPlaceholder() {
  return (
    <Card className="flex flex-col items-center gap-3 p-8 text-center">
      <p className="text-xl font-semibold text-text">Participations</p>
      <p className="text-sm font-medium text-muted">
        Cette section arrive bientôt ! Vous pourrez y retrouver toutes les
        initiatives et événements auxquels vous participez.
      </p>
    </Card>
  );
}

function SettingsPanel({ settings }: { settings: SettingsData }) {
  return (
    <div className="space-y-5">
      <NotificationPreferencesForm
        initial={settings.notificationPrefs}
        pushPublicKey={settings.pushPublicKey}
      />
      <Card className="space-y-3 p-5">
        <ProfilAddCommuneButton memberships={settings.memberships} />
      </Card>
    </div>
  );
}

function formatMonthYear(value?: string) {
  if (!value) return "récemment";
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const diffDays = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)),
  );
  if (diffDays === 0) return "aujourd'hui";
  if (diffDays === 1) return "il y a 1 jour";
  if (diffDays < 7) return `il y a ${diffDays} jours`;
  if (diffDays < 14) return "il y a 1 semaine";
  return `il y a ${Math.floor(diffDays / 7)} semaines`;
}

