"use client";

import { Bell, BellOff, Mail, MapPin } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "@/lib/queries/messages";
import { cn } from "@/lib/utils/cn";
import { formatAddressLabel } from "@/lib/utils/format-address";
import type { NotificationPreferenceKey, NotificationPreferences } from "@/lib/types";

const NOTIFICATION_PREF_LABELS: Record<NotificationPreferenceKey, string> = {
  notify_message_announcement: "Messages sur mes annonces",
  notify_message_initiative: "Messages sur mes initiatives",
  notify_message_event: "Messages sur mes événements",
  notify_initiative_support: "Soutien sur mes initiatives",
  notify_event_participation: "Participation sur mes événements",
  notify_event_volunteer: "Bénévolat sur mes événements",
  notify_new_announcement: "Nouvelle annonce",
  notify_new_initiative: "Nouvelle initiative",
  notify_new_event: "Nouvel événement",
};

function stopLinkNavigation(event: React.SyntheticEvent) {
  event.stopPropagation();
}

function InfoIconPopover({
  icon: Icon,
  ariaLabel,
  children,
  className,
}: {
  icon: typeof Mail;
  ariaLabel: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        nativeButton={false}
        render={
          <span
            role="button"
            tabIndex={0}
            className={cn(
              "inline-flex cursor-pointer items-center rounded-sm px-1 py-0.5 transition hover:bg-warm",
              className,
            )}
            aria-label={ariaLabel}
            onClick={stopLinkNavigation}
            onPointerDown={stopLinkNavigation}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                stopLinkNavigation(event);
              }
            }}
          />
        }
      >
        <Icon className="size-5 shrink-0 text-subtle" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={6}
        className="w-72 max-w-[min(calc(100vw-2rem),18rem)] p-3 text-sm"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

export function MemberEmailPopover({ email }: { email: string | null }) {
  if (!email) return null;

  return (
    <InfoIconPopover icon={Mail} ariaLabel="Voir l'adresse e-mail">
      <p className="font-semibold text-text">E-mail</p>
      <p className="break-all font-medium text-muted">{email}</p>
    </InfoIconPopover>
  );
}

export function MemberAddressPopover({
  street,
  lieuDit,
  postcode,
  city,
}: {
  street: string | null;
  lieuDit: string | null;
  postcode: string | null;
  city: string | null;
}) {
  const streetLine = [street, lieuDit].filter(Boolean).join(", ") || null;
  const formattedAddress = formatAddressLabel(streetLine, postcode, city);

  if (formattedAddress === "Adresse non renseignée") {
    return null;
  }

  return (
    <InfoIconPopover icon={MapPin} ariaLabel="Voir l'adresse">
      <p className="font-semibold text-text">Adresse dans la commune</p>
      <p className="font-medium text-muted">{formattedAddress}</p>
    </InfoIconPopover>
  );
}

function NotificationPreferencesList({
  preferences,
}: {
  preferences: NotificationPreferences;
}) {
  return (
    <ul className="space-y-2">
      {(Object.keys(NOTIFICATION_PREF_LABELS) as NotificationPreferenceKey[]).map(
        (key) => (
          <li
            key={key}
            className="flex min-h-6 items-start justify-between gap-3 py-1 font-medium leading-5 text-muted"
          >
            <span>{NOTIFICATION_PREF_LABELS[key]}</span>
            <span
              className={cn(
                "shrink-0 font-semibold",
                preferences[key]
                  ? "text-[color-mix(in_srgb,var(--mint)_75%,var(--text))]"
                  : "text-subtle",
              )}
            >
              {preferences[key] ? "Activé" : "Désactivé"}
            </span>
          </li>
        ),
      )}
    </ul>
  );
}

export function MemberNotificationPopover({
  hasPush,
  preferences,
}: {
  hasPush: boolean;
  preferences: NotificationPreferences | null;
}) {
  const Icon = hasPush ? Bell : BellOff;
  const resolvedPreferences = preferences ?? DEFAULT_NOTIFICATION_PREFERENCES;

  return (
    <InfoIconPopover
      icon={Icon}
      ariaLabel={
        hasPush
          ? "Notifications push activées — voir les préférences"
          : "Notifications push désactivées"
      }
      className={hasPush ? "text-mint" : "text-subtle"}
    >
      <p className="font-semibold text-text">
        {hasPush ? "Notifications push activées" : "Notifications push désactivées"}
      </p>
      {hasPush ? (
        <NotificationPreferencesList preferences={resolvedPreferences} />
      ) : (
        <p className="font-medium text-muted">
          Cet·te adhérent·e n&apos;a pas activé les notifications sur cet appareil.
        </p>
      )}
    </InfoIconPopover>
  );
}

export function MemberCardStatsLeading({
  email,
  street,
  lieuDit,
  postcode,
  city,
  hasPush,
  preferences,
}: {
  email: string | null;
  street: string | null;
  lieuDit: string | null;
  postcode: string | null;
  city: string | null;
  hasPush: boolean;
  preferences: NotificationPreferences | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <MemberEmailPopover key="email" email={email} />
      <MemberAddressPopover
        key="address"
        street={street}
        lieuDit={lieuDit}
        postcode={postcode}
        city={city}
      />
      <MemberNotificationPopover
        key="notifications"
        hasPush={hasPush}
        preferences={preferences}
      />
    </div>
  );
}
