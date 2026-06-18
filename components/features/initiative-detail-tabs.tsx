"use client";

import { useState } from "react";
import { submitInitiativeResponse } from "@/lib/actions/initiatives";
import { GradientButton } from "@/components/ui/gradient-button";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { id: "about", label: "À propos" },
  { id: "info", label: "Infos pratiques" },
  { id: "participants", label: "Participants" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type Props = {
  initiativeId: string;
  description: string | null;
  dateMode: string;
  startsAt: string | null;
  endsAt: string | null;
  addressLabel: string | null;
  participantCount: number;
};

export function InitiativeDetailTabs({
  initiativeId,
  description,
  dateMode,
  startsAt,
  endsAt,
  addressLabel,
  participantCount,
}: Props) {
  const [tab, setTab] = useState<TabId>("about");
  const [pending, setPending] = useState(false);

  async function participate() {
    setPending(true);
    await submitInitiativeResponse(initiativeId);
    setPending(false);
  }

  return (
    <div className="space-y-4">
      <GradientButton
        type="button"
        gradient="initiative"
        className="w-full"
        disabled={pending}
        onClick={participate}
      >
        {pending ? "Inscription…" : "Je veux participer"}
      </GradientButton>

      <nav className="flex gap-2 overflow-x-auto border-b border-border pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 cursor-pointer rounded-sm px-3 py-1.5 text-sm font-semibold",
              tab === t.id ? "bg-soft-pink text-purple" : "text-muted",
            )}
          >
            {t.label}
            {t.id === "participants" ? ` (${participantCount})` : ""}
          </button>
        ))}
      </nav>

      {tab === "about" ? (
        <p className="whitespace-pre-line text-base text-muted">
          {description ?? "Pas de description pour le moment."}
        </p>
      ) : null}

      {tab === "info" ? (
        <ul className="space-y-2 text-sm text-muted">
          <li>Temporalité : {dateMode}</li>
          {startsAt ? <li>Début : {new Date(startsAt).toLocaleString("fr-FR")}</li> : null}
          {endsAt ? <li>Fin : {new Date(endsAt).toLocaleString("fr-FR")}</li> : null}
          {addressLabel ? <li>Lieu : {addressLabel}</li> : null}
        </ul>
      ) : null}

      {tab === "participants" ? (
        <p className="text-sm text-muted">
          {participantCount} participant{participantCount !== 1 ? "s" : ""} inscrit
          {participantCount !== 1 ? "s" : ""}.
        </p>
      ) : null}
    </div>
  );
}
