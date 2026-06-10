"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ensureContextConversation } from "@/lib/actions/messages";
import { ROUTES } from "@/lib/constants/routes";
import { GradientButton } from "@/components/ui/gradient-button";

type Props = {
  announcementId: string;
  label: string;
};

export function ContactAnnouncementButton({ announcementId, label }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleContact() {
    startTransition(async () => {
      const result = await ensureContextConversation("announcement", announcementId);
      if (result.ok) {
        router.push(ROUTES.messageThread(result.conversationId));
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
