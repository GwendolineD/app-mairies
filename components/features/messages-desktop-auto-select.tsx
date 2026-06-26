"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";

/**
 * On desktop (≥ md), auto-open the first conversation when landing on `/messages`
 * so the right pane is not empty. Skipped on mobile where the list is a full screen.
 */
export function MessagesDesktopAutoSelect({
  firstConversationId,
  view,
}: {
  firstConversationId: string;
  view: "active" | "archived";
}) {
  const router = useRouter();

  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (!isDesktop) return;

    const suffix = view === "archived" ? "?vue=corbeille" : "";
    const target = ROUTES.messages.detail(firstConversationId) + suffix;
    router.replace(target);
  }, [firstConversationId, view, router]);

  return null;
}
