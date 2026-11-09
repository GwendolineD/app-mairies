"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { NotificationItem } from "@/components/features/notifications/notification-item";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  fetchNotificationsPage,
  markAllNotificationsRead,
} from "@/lib/actions/notifications";
import { NOTIFICATIONS_POPOVER_SIZE } from "@/lib/queries/notifications";
import { ROUTES } from "@/lib/constants/routes";
import type { NotificationItem as NotificationItemData } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  /** Server-rendered unread badge (Suspense-wrapped by the layout). */
  badge: ReactNode;
};

const TRIGGER_CLASS =
  "relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted transition hover:bg-warm hover:text-text focus-visible:ring-2 focus-visible:ring-purple/30 outline-none";

/**
 * Header bell. Mobile: plain link to the notifications page.
 * Desktop: popover that lazily loads the latest notifications on open.
 */
export function NotificationBell({ badge }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItemData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [marking, startMarking] = useTransition();

  // Refresh the server-rendered badge when the tab regains focus so a push
  // received while away is reflected without a full navigation.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") router.refresh();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router]);

  async function load() {
    setLoading(true);
    try {
      const page = await fetchNotificationsPage(undefined, NOTIFICATIONS_POPOVER_SIZE);
      setItems(page.items);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) void load();
    else router.refresh();
  }

  function handleMarkAll() {
    startMarking(async () => {
      await markAllNotificationsRead();
      const now = new Date().toISOString();
      setItems((prev) => prev?.map((n) => ({ ...n, read_at: n.read_at ?? now })) ?? null);
      router.refresh();
    });
  }

  const hasUnread = items?.some((n) => n.read_at === null) ?? false;

  return (
    <>
      {/* Mobile: direct link to the full page */}
      <Link
        href={ROUTES.notifications}
        aria-label="Notifications"
        className={cn(TRIGGER_CLASS, "md:hidden")}
      >
        <Bell className="size-5" aria-hidden />
        {badge}
      </Link>

      {/* Desktop: popover preview */}
      <div className="hidden md:block">
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger
            aria-label="Notifications"
            className={TRIGGER_CLASS}
          >
            <Bell className="size-5" aria-hidden />
            {badge}
          </PopoverTrigger>

          <PopoverContent
            align="end"
            sideOffset={8}
            className="w-[min(calc(100vw-2rem),380px)] gap-0 p-0"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Notifications
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!hasUnread || marking}
                onClick={handleMarkAll}
                className="h-8 gap-1.5 px-2 text-xs text-purple"
              >
                <CheckCheck className="size-3.5" aria-hidden />
                Tout marquer comme lu
              </Button>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {loading && items === null ? (
                <ul className="divide-y divide-border/40" aria-busy="true">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <li key={i} className="flex items-start gap-3 px-3 py-2.5">
                      <span className="size-8 shrink-0 animate-pulse rounded-full bg-warm" />
                      <span className="flex min-w-0 flex-1 flex-col gap-1.5 pt-1">
                        <span className="h-3 w-3/4 animate-pulse rounded-sm bg-warm" />
                        <span className="h-2.5 w-1/2 animate-pulse rounded-sm bg-warm" />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : items && items.length > 0 ? (
                <ul className="divide-y divide-border/40">
                  {items.map((item) => (
                    <li key={item.id}>
                      <NotificationItem
                        item={item}
                        compact
                        onNavigate={() => setOpen(false)}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-6 text-center text-sm text-muted">
                  Rien de nouveau pour l&apos;instant.
                </p>
              )}
            </div>

            <div className="border-t border-border/60 p-2">
              <Link
                href={ROUTES.notifications}
                onClick={() => setOpen(false)}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-10 w-full justify-center text-sm font-semibold text-purple",
                )}
              >
                Voir toutes les notifications
              </Link>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
