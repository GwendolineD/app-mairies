import type { AnnouncementType } from "@/lib/constants/announcement-types";

export const OUTCOME_REASONS = ["fulfilled", "unfulfilled"] as const;

export type OutcomeReason = (typeof OUTCOME_REASONS)[number];

export type ContentKind = "announcement" | "event";

export function isOutcomeReason(value: string): value is OutcomeReason {
  return OUTCOME_REASONS.includes(value as OutcomeReason);
}

type OutcomeCopy = {
  question: string;
  fulfilled: string;
  unfulfilled: string;
};

const ANNOUNCEMENT_OUTCOME_COPY: Record<AnnouncementType, OutcomeCopy> = {
  demande: {
    question:
      "Avant de retirer votre annonce, avez-vous trouvé l'aide recherchée ?",
    fulfilled: "Oui, j'ai trouvé l'aide recherchée",
    unfulfilled: "Non, je n'ai pas trouvé",
  },
  offre: {
    question:
      "Avant de retirer votre annonce, avez-vous pu aider un voisin ?",
    fulfilled: "Oui, j'ai pu aider un voisin",
    unfulfilled: "Non, je ne peux plus proposer cette aide",
  },
};

const EVENT_OUTCOME_COPY: OutcomeCopy = {
  question: "Cet événement a-t-il eu lieu ?",
  fulfilled: "Oui, il a bien eu lieu",
  unfulfilled: "Non, il a été annulé",
};

export function getAnnouncementOutcomeCopy(type: AnnouncementType): OutcomeCopy {
  return ANNOUNCEMENT_OUTCOME_COPY[type];
}

export function getEventOutcomeCopy(): OutcomeCopy {
  return EVENT_OUTCOME_COPY;
}
