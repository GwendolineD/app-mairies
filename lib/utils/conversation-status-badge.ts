import { MEMBERSHIP_STATUS } from "@/lib/constants/statuses";
import type {
  ConversationContextStatus,
  ConversationInboxItem,
  MembershipStatus,
} from "@/lib/types";

export type ConversationStatusBadgeInput = {
  context_status: ConversationContextStatus | null;
  other_membership_status: MembershipStatus | null;
};

/** Priority: member suspended > content suspended > content deleted. */
export function getConversationStatusBadgeLabel(
  item: ConversationStatusBadgeInput | ConversationInboxItem,
): string | null {
  if (item.other_membership_status === MEMBERSHIP_STATUS.suspended) {
    return "Membre suspendu";
  }
  if (item.context_status === "suspended") {
    return "Contenu suspendu";
  }
  if (item.context_status === "deleted") {
    return "Contenu supprimé";
  }
  return null;
}

export function getConversationReadOnlyMessage(
  item: ConversationStatusBadgeInput,
): string {
  if (item.other_membership_status === MEMBERSHIP_STATUS.suspended) {
    return "Ce membre a été suspendu. Vous ne pouvez plus envoyer de messages.";
  }
  if (item.context_status === "deleted") {
    return "Le contenu lié à cette conversation a été supprimé. Vous ne pouvez plus envoyer de messages.";
  }
  if (item.context_status === "suspended") {
    return "Le contenu lié à cette conversation a été suspendu. Vous ne pouvez plus envoyer de messages.";
  }
  return "Le contenu lié à cette conversation n'est plus disponible. Vous ne pouvez plus envoyer de messages.";
}
