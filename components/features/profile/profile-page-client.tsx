"use client";

import { useState } from "react";
import Image from "next/image";
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
import { ROUTES } from "@/lib/constants/routes";
import { ProfileTabs, type ProfileTabKey } from "@/components/features/profile/profile-tabs";
import { ProfileEmptyState } from "@/components/features/profile/profile-empty-state";
import { ProfilEditModal } from "@/components/features/profile/profil-edit-modal";
import { NeighborInviteBlock } from "@/components/features/profile/neighbor-invite-block";
import { NotificationPreferencesForm } from "@/components/features/notification-preferences-form";
import { AnnouncementCard } from "@/components/features/announcement-card";
import { InitiativeCard } from "@/components/features/initiative-card";
import { EventCard } from "@/components/features/event-card";
import type { AnnouncementWithAuthor } from "@/lib/queries/announcements";
import type { InitiativeWithAuthor } from "@/lib/queries/initiatives";
import type {
  AgendaEventRecord,
  NotificationPreferences,
} from "@/lib/types";

type ProfileData = {
  displayName: string;
  firstName: string | null;
  lastName: string | null;
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
  addressStreet: string | null;
  addressPostcode: string | null;
  addressCity: string | null;
  addressCitycode: string | null;
  addressLat: number | null;
  addressLng: number | null;
};

type InviteData = {
  senderName: string;
  communeName: string;
  inviteCount: number;
};

type SettingsData = {
  notificationPrefs: NotificationPreferences;
  pushPublicKey: string | null;
};

type Props = {
  profile: ProfileData;
  membership: MembershipData;
  activeTab: ProfileTabKey;
  announcements: AnnouncementWithAuthor[];
  initiatives: InitiativeWithAuthor[];
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
    <PageStack gap="5" className="-mx-4 -mt-4 md:mx-0 md:mt-0">
      <ProfileHero
        profile={profile}
        membership={membership}
        onEdit={() => setEditOpen(true)}
      />

      <ProfileTabs activeTab={activeTab} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="px-4 md:px-0">
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

        <aside className="space-y-5 px-4 md:px-0">
          <NeighborInviteBlock
            senderName={invite.senderName}
            communeName={invite.communeName}
            inviteCount={invite.inviteCount}
          />
        </aside>
      </div>

      <ProfilEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        avatarUrl={profile.avatarUrl}
        firstName={profile.firstName}
        lastName={profile.lastName}
        communeName={membership.communeName}
        addressStreet={membership.addressStreet}
        addressPostcode={membership.addressPostcode}
        addressCity={membership.addressCity}
        addressCitycode={membership.addressCitycode}
        addressLat={membership.addressLat}
        addressLng={membership.addressLng}
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
    <Card className="relative overflow-hidden rounded-none border-0 p-0 shadow-none md:rounded-xl md:border md:border-border/60 md:shadow-card">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="absolute right-4 top-4 z-10 size-9 shrink-0 p-0 md:hidden"
        onClick={onEdit}
        aria-label="Éditer mon profil"
      >
        <Pencil className="size-4" aria-hidden />
      </Button>
      <div className="relative grid gap-4 p-5 pt-14 md:grid-cols-[auto_1fr] md:gap-5 md:p-6 md:pt-6">
        <div className="mx-auto flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-soft-pink text-3xl font-bold text-purple shadow-card md:mx-0 md:row-span-2">
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
        <div className="flex min-w-0 items-center justify-center gap-3 md:justify-between">
          <h1 className="text-center text-xl font-bold leading-7 text-text md:text-left md:text-[28px] md:leading-9">
            {profile.displayName}
          </h1>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="hidden shrink-0 md:inline-flex"
            onClick={onEdit}
          >
            <Pencil className="size-3.5" aria-hidden />
            Éditer mon profil
          </Button>
        </div>
        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col items-center gap-1 text-center text-xs font-semibold text-muted md:items-start md:text-left">
            <span className="inline-flex items-start gap-1">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              {membership.addressStreet ||
              membership.addressPostcode ||
              membership.addressCity ? (
                <span className="flex flex-col items-start">
                  {membership.addressStreet ? (
                    <span>{membership.addressStreet}</span>
                  ) : null}
                  {membership.addressPostcode || membership.addressCity ? (
                    <span>
                      {[membership.addressPostcode, membership.addressCity]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                  ) : null}
                </span>
              ) : (
                membership.fullAddress
              )}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-4 shrink-0" aria-hidden />
              Membre depuis {formatMonthYear(membership.joinedAt)}
            </span>
          </div>
          <div className="grid shrink-0 grid-cols-3 gap-3 md:w-80">
            <ProfileStat label="Annonces" value={membership.totalAnnouncements} sublabel="publiées" />
            <ProfileStat label="Initiatives" value={membership.totalInitiatives} sublabel="organisées" />
            <ProfileStat label="Événements" value={membership.totalEvents} sublabel="créés" />
          </div>
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
    <div className="rounded-2xl bg-warm px-2 py-3 text-center md:px-3 md:py-4">
      <p className="text-xl font-bold leading-7 text-text">{value}</p>
      <p className="text-[10px] font-semibold leading-4 text-muted">{label}</p>
      {sublabel && (
        <p className="text-[9px] font-medium leading-4 text-subtle">{sublabel}</p>
      )}
    </div>
  );
}

function AnnouncementsPanel({
  announcements,
}: {
  announcements: AnnouncementWithAuthor[];
}) {
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
    <div className="space-y-4">
      <h2 className="text-xl font-semibold leading-7 text-text">
        Mes annonces en cours
      </h2>
      <div className="space-y-3">
        {announcements.map((a) => (
          <AnnouncementCard key={a.id} announcement={a} layout="horizontal" />
        ))}
      </div>
    </div>
  );
}

function InitiativesPanel({
  initiatives,
}: {
  initiatives: InitiativeWithAuthor[];
}) {
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
    <div className="space-y-4">
      <h2 className="text-xl font-semibold leading-7 text-text">
        Mes initiatives en cours
      </h2>
      <div className="space-y-3">
        {initiatives.map((i) => (
          <InitiativeCard key={i.id} initiative={i} layout="horizontal" />
        ))}
      </div>
    </div>
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
    <div className="space-y-4">
      <h2 className="text-xl font-semibold leading-7 text-text">
        Mes événements en cours
      </h2>
      <div className="space-y-3">
        {events.map((e) => (
          <EventCard key={e.id} event={e} layout="horizontal" />
        ))}
      </div>
    </div>
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
    <NotificationPreferencesForm
      initial={settings.notificationPrefs}
      pushPublicKey={settings.pushPublicKey}
      cardClassName="rounded-none border-0 p-0 shadow-none md:rounded-3xl md:border md:border-border/60 md:p-5 md:shadow-card"
    />
  );
}

function formatMonthYear(value?: string) {
  if (!value) return "récemment";
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
