"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { dismissNotificationPrompt } from "@/lib/actions/notifications";
import { ROUTES } from "@/lib/constants/routes";
import { activatePushSubscription } from "@/lib/hooks/use-push-subscription";
import { Button } from "@/components/ui/button";

type Props = {
  hasSeenOnboarding: boolean;
  hasDismissedNotificationPrompt: boolean;
  pushPublicKey: string | null;
};

export function NotificationPromptBanner({
  hasSeenOnboarding,
  hasDismissedNotificationPrompt,
  pushPublicKey,
}: Props) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(hasDismissedNotificationPrompt);
  const [activating, setActivating] = useState(false);
  const [, startTransition] = useTransition();

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    startTransition(() => {
      void dismissNotificationPrompt();
    });
  }, []);

  const handleActivate = useCallback(async () => {
    setActivating(true);
    if (pushPublicKey) {
      await activatePushSubscription(pushPublicKey);
    }
    setDismissed(true);
    await dismissNotificationPrompt();
    setActivating(false);
    router.push(`${ROUTES.profil}?tab=parametres`);
  }, [pushPublicKey, router]);

  if (!hasSeenOnboarding || dismissed) {
    return null;
  }

  return (
    <div
      className="-mx-5 -mt-4 mb-4 flex w-[calc(100%+2.5rem)] flex-col gap-3 border-b border-border/60 bg-soft-pink px-5 py-3 sm:flex-row sm:items-center sm:justify-between md:-mx-6 md:w-[calc(100%+3rem)] lg:-mx-8 lg:w-[calc(100%+4rem)]"
      role="region"
      aria-label="Activer les notifications"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-purple/10">
          <Bell className="size-4 text-purple" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold leading-5 text-text">
            Restez informé·e de votre commune
          </span>
          <span className="block text-xs font-medium leading-4 text-muted">
            Activez les notifications pour ne rien manquer
          </span>
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={handleDismiss}>
          Non, merci
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => void handleActivate()}
          disabled={activating}
        >
          {activating ? "Activation…" : "J'active"}
        </Button>
      </div>
    </div>
  );
}
