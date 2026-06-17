import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  ChevronRight,
  HeartHandshake,
  Leaf,
  Mail,
  MapPin,
  Megaphone,
  UserRound,
} from "lucide-react";
import { AnnouncementTypeTag } from "@/components/ui/announcement-type-tag";
import { requireActiveMembership } from "@/lib/auth/session";
import { createNeighborInvite } from "@/lib/actions/messages";
import { createClient } from "@/lib/supabase/server";
import { getNotificationPreferences } from "@/lib/queries/messages";
import { getPushPublicKey } from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { Input } from "@/components/ui/input";
import { PageStack } from "@/components/ui/page-stack";
import { ProfileSkeleton } from "@/components/features/profile/profile-skeleton";
import { ProfileTabs, isProfileTab, type ProfileTabKey } from "@/components/features/profile/profile-tabs";
import { ProfileEmptyState } from "@/components/features/profile/profile-empty-state";
import { CreateAnnouncementModal } from "@/components/features/profile/create-announcement-modal";
import { NeighborInviteCard } from "@/components/features/profile/neighbor-invite-card";
import { NotificationPreferencesForm } from "@/components/features/notification-preferences-form";
import { ProfilAddCommuneButton } from "@/components/features/profil-add-commune-button";
import { updateNotificationPreferences } from "@/lib/actions/profile";
import { NEIGHBOR_INVITE_TEMPLATE_KEY } from "@/lib/constants/email-templates";
import { getCategoryLabel } from "@/lib/constants/announcement-categories";
import type {
  Announcement,
  InitiativeRecord,
  Membership,
  NotificationPreferences,
  ProfileNotificationPreferences,
} from "@/lib/types";
import { normalizeNeighborInviteTemplate } from "@/lib/utils/email-template";
import { ROUTES } from "@/lib/constants/routes";

type SearchParams = Promise<{ tab?: string }> | undefined;

type InitiativeParticipation = {
  id: string;
  response_type: "support" | "volunteer";
  created_at: string;
  initiatives:
    | {
        id: string;
        title: string;
        commune_id: string;
        status: string;
        created_at: string;
      }
    | {
        id: string;
        title: string;
        commune_id: string;
        status: string;
        created_at: string;
      }[];
};

type NeighborInvite = {
  id: string;
  email: string;
  created_at: string;
};

type ActivityItem = {
  id: string;
  title: string;
  meta: string;
  href?: string;
  createdAt: string;
  icon: "announcement" | "initiative" | "participation" | "invite";
  imageUrl?: string | null;
};

export default function ProfilPage({ searchParams }: { searchParams?: SearchParams }) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfilContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ProfilContent({ searchParams }: { searchParams?: SearchParams }) {
  const sp = (await searchParams) ?? {};
  const activeTab: ProfileTabKey = isProfileTab(sp.tab ?? "")
    ? (sp.tab as ProfileTabKey)
    : "activite";
  const ctx = await requireActiveMembership();
  const profile = ctx.profile;
  const membership = ctx.activeMembership!;
  const communeId = membership.commune_id;
  const membershipId = membership.id;

  const supabase = await createClient();
  const [
    announcementsResult,
    initiativesResult,
    participationsResult,
    invitesResult,
    preferencesResult,
    templateResult,
    notificationPrefs,
    pushPublicKey,
  ] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, commune_id, author_membership_id, type, category_slug, title, description, photo_url, target_date, status, created_at", {
        count: "exact",
      })
      .eq("commune_id", communeId)
      .eq("author_membership_id", membershipId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("initiatives")
      .select("id, commune_id, author_membership_id, title, description, date_mode, single_starts_at, single_ends_at, recurrence_rule, status, address_lat, address_lng, created_at, updated_at", {
        count: "exact",
      })
      .eq("commune_id", communeId)
      .eq("author_membership_id", membershipId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("initiative_responses")
      .select("id, response_type, created_at, initiatives!inner(id, title, commune_id, status, created_at)", {
        count: "exact",
      })
      .eq("membership_id", membershipId)
      .eq("initiatives.commune_id", communeId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("neighbor_invites")
      .select("id, email, created_at", { count: "exact" })
      .eq("commune_id", communeId)
      .eq("inviter_membership_id", membershipId)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("profile_notification_preferences")
      .select("*")
      .eq("user_id", ctx.userId)
      .maybeSingle(),
    supabase
      .from("commune_email_templates")
      .select("subject, preheader, body_markdown, cta_label")
      .eq("commune_id", communeId)
      .eq("template_key", NEIGHBOR_INVITE_TEMPLATE_KEY)
      .maybeSingle(),
    getNotificationPreferences(supabase, ctx.userId),
    getPushPublicKey(),
  ]);

  logQueryError("announcements", announcementsResult.error);
  logQueryError("initiatives", initiativesResult.error);
  logQueryError("initiative_responses", participationsResult.error);
  logQueryError("neighbor_invites", invitesResult.error);
  logQueryError("profile_notification_preferences", preferencesResult.error);
  logQueryError("commune_email_templates", templateResult.error);

  const announcements = (announcementsResult.data ?? []) as Announcement[];
  const initiatives = (initiativesResult.data ?? []) as InitiativeRecord[];
  const participations = (participationsResult.data ?? []) as InitiativeParticipation[];
  const invites = (invitesResult.data ?? []) as NeighborInvite[];
  const preferences = normalizePreferences(
    preferencesResult.data as ProfileNotificationPreferences | null,
  );
  const template = normalizeNeighborInviteTemplate(templateResult.data);
  const displayName = getDisplayName(profile);
  const communeName = membership.commune?.name ?? "Votre commune";
  const activity = buildActivityItems(announcements, initiatives, participations, invites);

  return (
    <PageStack gap="5">
      <ProfileHero
        displayName={displayName}
        handle={profile.display_name ?? profile.first_name ?? "voisin"}
        avatarUrl={profile.avatar_url}
        communeName={communeName}
        joinedAt={membership.created_at}
        stats={{
          announcements: announcementsResult.count ?? announcements.length,
          initiatives: initiativesResult.count ?? initiatives.length,
          participations: participationsResult.count ?? participations.length,
        }}
      />

      <ProfileTabs activeTab={activeTab} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
        <section>
          {renderMainPanel({
            activeTab,
            activity,
            announcements,
            initiatives,
            participations,
            preferences,
            notificationPrefs,
            pushPublicKey,
            memberships: ctx.memberships,
          })}
        </section>

        <aside className="space-y-5">
          <AboutCard
            displayName={displayName}
            addressLabel={membership.address_street ?? membership.address_city}
            communeName={communeName}
          />
          <NeighborInviteCard
            template={template}
            senderName={displayName}
            communeName={communeName}
            inviteCount={invitesResult.count ?? invites.length}
          />
        </aside>
      </div>
    </PageStack>
  );
}

function ProfileHero({
  displayName,
  handle,
  avatarUrl,
  communeName,
  joinedAt,
  stats,
}: {
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  communeName: string;
  joinedAt?: string;
  stats: { announcements: number; initiatives: number; participations: number };
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="h-24 gradient-hero opacity-80" />
      <div className="flex flex-col gap-5 p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="-mt-16 flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex size-28 items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-soft-pink text-3xl font-bold text-purple shadow-card">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={112}
                height={112}
                unoptimized
                className="size-full object-cover"
              />
            ) : (
              getInitials(displayName)
            )}
          </div>
          <div className="space-y-2">
            <h1 className="text-[28px] font-bold leading-9 text-text">{displayName}</h1>
            <p className="text-sm font-semibold text-purple">@{slugifyHandle(handle)}</p>
            <div className="flex flex-wrap gap-3 text-xs font-semibold text-muted">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4" aria-hidden />
                {communeName}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-4" aria-hidden />
                Membre depuis {formatMonthYear(joinedAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 md:w-80">
          <ProfileStat label="Annonces" value={stats.announcements} />
          <ProfileStat label="Initiatives" value={stats.initiatives} />
          <ProfileStat label="Participations" value={stats.participations} />
        </div>
      </div>
    </Card>
  );
}

function ProfileStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-warm px-3 py-4 text-center">
      <p className="text-xl font-bold leading-7 text-text">{value}</p>
      <p className="text-xs font-semibold text-muted">{label}</p>
    </div>
  );
}

function renderMainPanel({
  activeTab,
  activity,
  announcements,
  initiatives,
  participations,
  preferences,
  notificationPrefs,
  pushPublicKey,
  memberships,
}: {
  activeTab: ProfileTabKey;
  activity: ActivityItem[];
  announcements: Announcement[];
  initiatives: InitiativeRecord[];
  participations: InitiativeParticipation[];
  preferences: ProfileNotificationPreferences;
  notificationPrefs: unknown;
  pushPublicKey: string | null;
  memberships: Membership[];
}) {
  if (activeTab === "annonces") {
    return <AnnouncementsPanel announcements={announcements} />;
  }
  if (activeTab === "initiatives") {
    return <InitiativesPanel initiatives={initiatives} />;
  }
  if (activeTab === "participations") {
    return <ParticipationsPanel participations={participations} />;
  }
  if (activeTab === "parametres") {
    return (
      <div className="space-y-5">
        <SettingsPanel preferences={preferences} />
        {notificationPrefs != null ? (
          <NotificationPreferencesForm
            initial={notificationPrefs as NotificationPreferences}
            pushPublicKey={pushPublicKey}
          />
        ) : null}
        <Card className="space-y-3 p-5">
          <ProfilAddCommuneButton memberships={memberships} />
        </Card>
      </div>
    );
  }
  return <ActivityPanel items={activity} />;
}

function ActivityPanel({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <ProfileEmptyState
        title="Votre profil va vite prendre vie"
        description="Publiez une première annonce, soutenez une initiative ou invitez un voisin : chaque petit geste crée du lien."
        action={<CreateAnnouncementModal />}
      />
    );
  }

  return (
    <Card className="p-5">
      <h2 className="text-xl font-semibold leading-7 text-text">Activité récente</h2>
      <div className="mt-4 divide-y divide-border">
        {items.map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
      </div>
    </Card>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = {
    announcement: Megaphone,
    initiative: Leaf,
    participation: HeartHandshake,
    invite: Mail,
  }[item.icon];
  const content = (
    <div className="flex items-center gap-3 py-3">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-soft-pink text-purple">
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text">{item.title}</p>
        <p className="text-xs font-medium text-muted">{item.meta}</p>
      </div>
      {item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt=""
          width={80}
          height={56}
          unoptimized
          className="hidden h-14 w-20 rounded-xl object-cover sm:block"
        />
      ) : null}
      {item.href ? <ChevronRight className="size-4 text-muted" aria-hidden /> : null}
    </div>
  );

  return item.href ? (
    <Link href={item.href} className="block hover:bg-warm/60">
      {content}
    </Link>
  ) : (
    content
  );
}

function AnnouncementsPanel({ announcements }: { announcements: Announcement[] }) {
  if (announcements.length === 0) {
    return (
      <ProfileEmptyState
        title="Une première annonce peut aider tout le quartier"
        description="Besoin d'un outil, d'un coup de main ou envie de proposer votre aide ? Commencez simplement, les voisin·es verront votre message."
        action={<CreateAnnouncementModal />}
      />
    );
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold leading-7 text-text">Mes annonces</h2>
        <CreateAnnouncementModal triggerLabel="Ajouter" className="px-4 py-2 text-xs" />
      </div>
      <div className="space-y-3">
        {announcements.map((announcement) => (
          <Link key={announcement.id} href={ROUTES.annonces.detail(announcement.id)}>
            <div className="rounded-2xl border border-border p-4 transition hover:border-purple/40">
              <div className="flex flex-wrap gap-2">
                <AnnouncementTypeTag type={announcement.type} />
                <CategoryTag label={getCategoryLabel(announcement.category_slug)} />
              </div>
              <p className="mt-2 text-base font-semibold leading-6 text-text">
                {announcement.title}
              </p>
              <p className="mt-1 text-xs font-semibold text-muted">
                {announcement.status} · {formatRelativeDate(announcement.created_at)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function InitiativesPanel({ initiatives }: { initiatives: InitiativeRecord[] }) {
  if (initiatives.length === 0) {
    return (
      <ProfileEmptyState
        title="Votre prochaine idée peut devenir collective"
        description="Un jardin partagé, une balade, un atelier numérique : donnez une forme simple à votre initiative."
        action={<Button href={ROUTES.initiatives.new}>Lancer une initiative</Button>}
      />
    );
  }

  return (
    <Card className="space-y-4 p-5">
      <h2 className="text-xl font-semibold leading-7 text-text">Mes initiatives</h2>
      {initiatives.map((initiative) => (
        <Link key={initiative.id} href={ROUTES.initiatives.detail(initiative.id)}>
          <div className="rounded-2xl border border-border p-4 transition hover:border-mint/60">
            <p className="text-base font-semibold leading-6 text-text">{initiative.title}</p>
            <p className="mt-1 line-clamp-2 text-sm font-medium leading-5 text-muted">
              {initiative.description ?? "Invitation ouverte à la commune."}
            </p>
            <p className="mt-2 text-xs font-semibold text-muted">
              {formatRelativeDate(initiative.created_at)}
            </p>
          </div>
        </Link>
      ))}
    </Card>
  );
}

function ParticipationsPanel({
  participations,
}: {
  participations: InitiativeParticipation[];
}) {
  if (participations.length === 0) {
    return (
      <ProfileEmptyState
        title="Des initiatives attendent votre soutien"
        description="Un encouragement ou une présence bénévole suffit souvent à faire avancer un projet local."
        action={<Button href={ROUTES.initiatives.list}>Découvrir les initiatives</Button>}
      />
    );
  }

  return (
    <Card className="space-y-4 p-5">
      <h2 className="text-xl font-semibold leading-7 text-text">Mes participations</h2>
      {participations.map((participation) => {
        const initiative = getParticipationInitiative(participation);
        return (
          <Link key={participation.id} href={ROUTES.initiatives.detail(initiative.id)}>
            <div className="rounded-2xl border border-border p-4 transition hover:border-mint/60">
              <p className="text-base font-semibold leading-6 text-text">{initiative.title}</p>
              <p className="mt-1 text-sm font-medium leading-5 text-muted">
                {participation.response_type === "volunteer"
                  ? "Vous vous êtes proposé·e comme bénévole."
                  : "Vous avez soutenu cette initiative."}
              </p>
              <p className="mt-2 text-xs font-semibold text-muted">
                {formatRelativeDate(participation.created_at)}
              </p>
            </div>
          </Link>
        );
      })}
    </Card>
  );
}

function SettingsPanel({
  preferences,
}: {
  preferences: ProfileNotificationPreferences;
}) {
  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="text-xl font-semibold leading-7 text-text">Paramètres</h2>
        <p className="mt-1 text-sm font-medium leading-5 text-muted">
          Choisissez les notifications utiles, sans perdre le fil de la vie locale.
        </p>
      </div>
      <form action={updateNotificationPreferences} className="space-y-4">
        <NotificationToggle
          name="messageNotificationsEnabled"
          title="Messages privés"
          description="Recevoir une notification quand un voisin vous écrit."
          defaultChecked={preferences.message_notifications_enabled}
        />
        <NotificationToggle
          name="announcementNotificationsEnabled"
          title="Annonces"
          description="Être prévenu·e des réponses ou suivis sur vos annonces."
          defaultChecked={preferences.announcement_notifications_enabled}
        />
        <NotificationToggle
          name="initiativeNotificationsEnabled"
          title="Initiatives"
          description="Suivre les nouveautés des initiatives auxquelles vous participez."
          defaultChecked={preferences.initiative_notifications_enabled}
        />
        <Button type="submit" className="w-full">Enregistrer mes préférences</Button>
      </form>
    </Card>
  );
}

function NotificationToggle({
  name,
  title,
  description,
  defaultChecked,
}: {
  name: string;
  title: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-4 transition hover:bg-warm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 size-4 accent-purple"
      />
      <span>
        <span className="block text-sm font-semibold text-text">{title}</span>
        <span className="mt-1 block text-sm font-medium leading-5 text-muted">
          {description}
        </span>
      </span>
    </label>
  );
}

function AboutCard({
  displayName,
  addressLabel,
  communeName,
}: {
  displayName: string;
  addressLabel: string | null;
  communeName: string;
}) {
  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold leading-7 text-text">À propos de moi</h2>
        <Button href={`${ROUTES.profil}?tab=parametres`} variant="secondary" className="px-4 py-2 text-xs">
          Modifier
        </Button>
      </div>
      <div className="flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-soft-pink text-purple">
          <UserRound className="size-5" aria-hidden />
        </div>
        <p className="text-sm font-medium leading-5 text-muted">
          {displayName} participe à la vie de {communeName}
          {addressLabel ? ` depuis ${addressLabel}` : ""}. Son profil rassemble ses
          annonces, initiatives et participations pour rendre l&apos;entraide plus visible.
        </p>
      </div>
    </Card>
  );
}

function buildActivityItems(
  announcements: Announcement[],
  initiatives: InitiativeRecord[],
  participations: InitiativeParticipation[],
  invites: NeighborInvite[],
): ActivityItem[] {
  return [
    ...announcements.map((announcement) => ({
      id: `announcement-${announcement.id}`,
      title: announcement.title,
      meta: `Annonce publiée · ${formatRelativeDate(announcement.created_at)}`,
      href: ROUTES.annonces.detail(announcement.id),
      createdAt: announcement.created_at,
      icon: "announcement" as const,
      imageUrl: announcement.photo_url,
    })),
    ...initiatives.map((initiative) => ({
      id: `initiative-${initiative.id}`,
      title: initiative.title,
      meta: `Initiative organisée · ${formatRelativeDate(initiative.created_at)}`,
      href: ROUTES.initiatives.detail(initiative.id),
      createdAt: initiative.created_at,
      icon: "initiative" as const,
    })),
    ...participations.map((participation) => {
      const initiative = getParticipationInitiative(participation);
      return {
        id: `participation-${participation.id}`,
        title: initiative.title,
        meta: `Participation ajoutée · ${formatRelativeDate(participation.created_at)}`,
        href: ROUTES.initiatives.detail(initiative.id),
        createdAt: participation.created_at,
        icon: "participation" as const,
      };
    }),
    ...invites.map((invite) => ({
      id: `invite-${invite.id}`,
      title: `Invitation envoyée à ${invite.email}`,
      meta: formatRelativeDate(invite.created_at),
      createdAt: invite.created_at,
      icon: "invite" as const,
    })),
  ]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 6);
}

function getParticipationInitiative(participation: InitiativeParticipation) {
  const initiative = Array.isArray(participation.initiatives)
    ? participation.initiatives[0]
    : participation.initiatives;
  return initiative ?? { id: "", title: "Initiative locale" };
}

function normalizePreferences(
  preferences?: ProfileNotificationPreferences | null,
): ProfileNotificationPreferences {
  return {
    user_id: preferences?.user_id ?? "",
    message_notifications_enabled:
      preferences?.message_notifications_enabled ?? true,
    announcement_notifications_enabled:
      preferences?.announcement_notifications_enabled ?? true,
    initiative_notifications_enabled:
      preferences?.initiative_notifications_enabled ?? true,
    updated_at: preferences?.updated_at ?? "",
  };
}

function getDisplayName(profile: { display_name: string | null; first_name: string | null; last_name: string | null }) {
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  return profile.display_name || fullName || "Voisin·e";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function slugifyHandle(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .slice(0, 24)
    .toLowerCase();
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

function logQueryError(label: string, error?: { message: string } | null) {
  if (error) {
    console.error(`Unable to load profile ${label}`, error.message);
  }
}
