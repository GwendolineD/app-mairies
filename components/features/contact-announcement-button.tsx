"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ensureAnnouncementConversation,
  ensureEventConversation,
  ensureInitiativeConversation,
} from "@/lib/actions/messages";
import { ROUTES } from "@/lib/constants/routes";
import { GradientButton } from "@/components/ui/gradient-button";
import type { ConversationContextType } from "@/lib/types";

type Props = {
  /** Id of the announcement / initiative / event to start the conversation about. */
  contextId: string;
  label: string;
  contextType?: ConversationContextType;
  /** Backwards-compatible alias for callers using the old API. */
  announcementId?: string;
};

const HANDLERS: Record<
  ConversationContextType,
  (id: string) => Promise<{ conversationId: string | null; error: string | null }>
> = {
  announcement: ensureAnnouncementConversation,
  initiative: ensureInitiativeConversation,
  event: ensureEventConversation,
};

export function ContactAnnouncementButton({
  contextId,
  announcementId,
  contextType = "announcement",
  label,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const id = contextId ?? announcementId;

  function handleContact() {
    if (!id) return;
    startTransition(async () => {
      const result = await HANDLERS[contextType](id);
      if (result.conversationId) {
        router.push(ROUTES.messages.detail(result.conversationId));
      }
    });
  }

  return (
    <GradientButton
      type="button"
      gradient="hero"
      className="w-full"
      disabled={pending}
      onClick={handleContact}
    >
      {pending ? "Ouverture…" : label}
    </GradientButton>
  );
}
