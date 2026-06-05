"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ensureContextConversation } from "@/lib/actions/messages";
import { ROUTES } from "@/lib/constants/routes";
import { GradientButton } from "@/components/ui/gradient-button";
import type { ContextType } from "@/lib/types";

type Props = {
  contextType: ContextType;
  contextId: string;
  gradient?: "demande" | "offre" | "initiative" | "events" | "hero";
  label?: string;
};

/** Opens (or creates) the 1:1 thread tied to this content item, then navigates. */
export function ContactButton({
  contextType,
  contextId,
  gradient = "hero",
  label = "Envoyer un message",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await ensureContextConversation(contextType, contextId);
      if (result.ok) {
        router.push(ROUTES.messageThread(result.conversationId));
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-2">
      <GradientButton
        type="button"
        gradient={gradient}
        onClick={handleClick}
        disabled={pending}
      >
        {pending ? "Ouverture…" : label}
      </GradientButton>
      {error ? (
        <p className="text-xs font-medium text-coral">{error}</p>
      ) : null}
    </div>
  );
}
