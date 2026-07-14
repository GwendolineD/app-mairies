"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type NudgeableContent, type NudgeReason, getContentNudgeReason } from "@/lib/utils/content-nudge";

type Props = {
  content: NudgeableContent;
  contentId: string;
  contentTitle: string;
  onDelete?: () => void;
  onEditDeadline?: () => void;
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

export function ContentNudgeBanner({
  content,
  contentId,
  contentTitle,
  onDelete,
  onEditDeadline,
  onSnooze,
  snoozeLoading,
}: Props) {
  const reason = getContentNudgeReason(content);
  if (!reason) return null;

  return (
    <div className="rounded-md border border-coral/30 bg-coral/5 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-coral" aria-hidden />
        <div className="flex-1 space-y-3">
          <p className="text-sm font-medium text-text">
            {MESSAGES[reason]}
          </p>
          <div className="flex flex-wrap gap-2">
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={onDelete}>
                Supprimer
              </Button>
            )}
            {reason === "announcement_expired" && onEditDeadline && (
              <Button variant="secondary" size="sm" onClick={onEditDeadline}>
                Modifier l&apos;échéance
              </Button>
            )}
            {onSnooze && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSnooze}
                disabled={snoozeLoading}
              >
                Attendre 1 mois
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
