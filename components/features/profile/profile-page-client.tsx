"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Camera,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageStack } from "@/components/ui/page-stack";
import { ROUTES } from "@/lib/constants/routes";
import { updateAvatar } from "@/lib/actions/profile";
import {
  CloudinaryUploadError,
  uploadImageToCloudinary,
} from "@/lib/services/cloudinary-client";
import { ProfileTabs, type ProfileTabKey } from "@/components/features/profile/profile-tabs";
import { ProfileEmptyState } from "@/components/features/profile/profile-empty-state";
import { NeighborInviteBlock } from "@/components/features/profile/neighbor-invite-block";
import { NotificationPreferencesForm } from "@/components/features/notification-preferences-form";
import { ProfileEditableRow } from "@/components/features/profile/profile-editable-row";
import { EditNameModal } from "@/components/features/profile/edit-name-modal";
import { EditAddressModal } from "@/components/features/profile/edit-address-modal";
import { EditEmailModal } from "@/components/features/profile/edit-email-modal";
import { ChangePasswordForm } from "@/components/features/profile/change-password-form";
import { AVATAR_PUBLIC_ID } from "@/lib/services/cloudinary";
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
  email: string | null;
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
  emailChanged?: boolean;
  emailChangeError?: boolean;
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
  emailChanged,
  emailChangeError,
}: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!emailChanged) return;
    toast.success("Votre adresse e-mail a été mise à jour.");
    router.replace(ROUTES.profil, { scroll: false });
  }, [emailChanged, router]);

  useEffect(() => {
    if (!emailChangeError) return;
    toast.error(
      "Lien de confirmation invalide ou expiré. Relancez le changement d'e-mail depuis votre profil.",
    );
    router.replace(ROUTES.profil, { scroll: false });
  }, [emailChangeError, router]);

  return (
    <PageStack gap="5" className="-mx-4 -mt-4 md:mx-0 md:mt-0">
      <ProfileHero profile={profile} membership={membership} />

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
    </PageStack>
  );
}

function ProfileHero({
  profile,
  membership,
}: {
  profile: ProfileData;
  membership: MembershipData;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nameOpen, setNameOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(profile.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setPreview(profile.avatarUrl);
  }, [profile.avatarUrl]);

  const initials = profile.displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setPreview(URL.createObjectURL(file));
      setUploading(true);
      try {
        const url = await uploadImageToCloudinary(
          file,
          "avatar",
          AVATAR_PUBLIC_ID,
        );
        startTransition(async () => {
          const result = await updateAvatar({ avatarUrl: url });
          if ("error" in result) {
            toast.error(result.error);
            setPreview(profile.avatarUrl);
            return;
          }
          setPreview(url);
          toast.success("Photo mise à jour !");
          router.refresh();
        });
      } catch (err) {
        const msg =
          err instanceof CloudinaryUploadError
            ? err.message
            : "Erreur lors de l'upload de la photo.";
        toast.error(msg);
        setPreview(profile.avatarUrl);
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [profile.avatarUrl, router],
  );

  return (
    <>
      <Card className="relative overflow-hidden rounded-none border-0 p-0 shadow-none md:rounded-xl md:border md:border-border/60 md:shadow-card">
        <div className="relative grid gap-4 p-5 md:grid-cols-[auto_1fr] md:gap-5 md:p-6">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || isPending}
            className="group relative mx-auto shrink-0 cursor-pointer md:mx-0 md:row-span-2"
            aria-label="Changer votre photo de profil"
          >
            <div className="relative flex size-28 items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-soft-pink text-3xl font-bold text-purple shadow-card">
              {preview ? (
                <Image
                  src={preview}
                  alt=""
                  width={112}
                  height={112}
                  unoptimized
                  className="size-full object-cover"
                />
              ) : (
                initials
              )}
              <div className="absolute inset-0 hidden items-center justify-center bg-text/40 opacity-0 transition group-hover:opacity-100 md:flex">
                {uploading || isPending ? (
                  <Loader2 className="size-6 animate-spin text-white" />
                ) : (
                  <Camera className="size-6 text-white" />
                )}
              </div>
            </div>
            <span className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-surface bg-surface text-muted shadow-card md:hidden">
              {uploading || isPending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Pencil className="size-3.5" aria-hidden />
              )}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex min-w-0 items-center justify-center md:justify-start">
            <ProfileEditableRow
              label="Modifier mon nom"
              onEdit={() => setNameOpen(true)}
              className="justify-center md:justify-start"
            >
              <h1 className="text-center text-xl font-bold leading-7 text-text md:text-left md:text-[28px] md:leading-9">
                {profile.displayName}
              </h1>
            </ProfileEditableRow>
          </div>

          <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col items-center gap-2.5 text-center text-xs font-semibold text-muted md:items-start md:gap-1 md:text-left">
              <span className="inline-flex items-start gap-1">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                <ProfileEditableRow
                  label="Modifier mon adresse"
                  onEdit={() => setAddressOpen(true)}
                >
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
                </ProfileEditableRow>
              </span>

              {profile.email ? (
                <span className="inline-flex items-start gap-1">
                  <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <ProfileEditableRow
                    label="Modifier mon email"
                    onEdit={() => setEmailOpen(true)}
                  >
                    <span className="break-all">{profile.email}</span>
                  </ProfileEditableRow>
                </span>
              ) : null}

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

      <EditNameModal
        open={nameOpen}
        onClose={() => setNameOpen(false)}
        firstName={profile.firstName}
        lastName={profile.lastName}
      />
      <EditAddressModal
        open={addressOpen}
        onClose={() => setAddressOpen(false)}
        communeName={membership.communeName}
        addressStreet={membership.addressStreet}
        addressPostcode={membership.addressPostcode}
        addressCity={membership.addressCity}
        addressCitycode={membership.addressCitycode}
        addressLat={membership.addressLat}
        addressLng={membership.addressLng}
      />
      <EditEmailModal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        currentEmail={profile.email}
      />
    </>
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
    <div className="space-y-5">
      <ChangePasswordForm cardClassName="rounded-none border-0 p-0 shadow-none md:rounded-3xl md:border md:border-border/60 md:p-5 md:shadow-card" />
      <NotificationPreferencesForm
        initial={settings.notificationPrefs}
        pushPublicKey={settings.pushPublicKey}
        cardClassName="rounded-none border-0 p-0 shadow-none md:rounded-3xl md:border md:border-border/60 md:p-5 md:shadow-card"
      />
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
