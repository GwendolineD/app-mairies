"use client";

import { AlertTriangle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type NudgeableContent, type NudgeReason, getContentNudgeReason } from "@/lib/utils/content-nudge";

type Props = {
  content: NudgeableContent;
  contentId: string;
  contentTitle: string;
  onDelete?: () => void;
  onSnooze?: () => void;
  snoozeLoading?: boolean;
};

const MESSAGES: Record<NudgeReason, string> = {
  announcement_expired:
    "L'échéance de votre annonce est dépassée. Souhaitez-vous la maintenir ?",
  announcement_stale:
    "Votre annonce est active depuis plus de 2 mois. Est-elle toujours d'actualité ?",
  initiative_stale:
    "Votre initiative est active depuis plus de 2 mois. Est-elle toujours d'actualité ?",
  event_past:
    "Votre événement est terminé. Souhaitez-vous le supprimer ?",
};

function NudgeMessage({ reason }: { reason: NudgeReason }) {
  if (reason === "announcement_expired") {
    return (
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-text">
          L&apos;échéance de votre annonce est dépassée.
        </p>
        <p className="text-sm font-medium text-text">
          Souhaitez-vous la maintenir ?
        </p>
      </div>
    );
  }

  return <p className="text-sm font-medium text-text">{MESSAGES[reason]}</p>;
}

export function ContentNudgeBanner({
  content,
  onDelete,
  onSnooze,
  snoozeLoading,
}: Props) {
  const reason = getContentNudgeReason(content);
  if (!reason) return null;

  const hasActions = onDelete || onSnooze;

  return (
    <div className="rounded-md border border-coral/30 bg-coral/5 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <AlertTriangle className="size-10 shrink-0 text-coral" aria-hidden />
          <div className="min-w-0 flex-1">
            <NudgeMessage reason={reason} />
          </div>
        </div>
        {hasActions ? (
          <div className="flex shrink-0 flex-col items-end gap-2">
            {onSnooze ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={onSnooze}
                disabled={snoozeLoading}
              >
                Attendre 1 mois
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-coral bg-surface text-coral hover:bg-coral/5"
                onClick={onDelete}
              >
                <Trash2 className="size-4" aria-hidden />
                Supprimer
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
