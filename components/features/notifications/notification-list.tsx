"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { NotificationItem } from "@/components/features/notifications/notification-item";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CloudImage } from "@/components/ui/cloud-image";
import { LoadMoreLink } from "@/components/ui/load-more-link";
import { PageHeading } from "@/components/ui/page-heading";
import {
  fetchNotificationsPage,
  markAllNotificationsRead,
} from "@/lib/actions/notifications";
import { useUnreadNotifications } from "@/components/features/notifications/unread-notifications-count";
import { ILLUSTRATIONS } from "@/lib/constants/illustrations";
import type { NotificationsPage } from "@/lib/queries/notifications";
import type { NotificationItem as NotificationItemData } from "@/lib/types";
import { groupNotifications } from "@/lib/utils/notification-grouping";

type Props = {
  initialPage: NotificationsPage;
  /** Server "now" (ISO) used for day/week grouping — keeps SSR and client in sync. */
  now: string;
};

export function NotificationList({ initialPage, now }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItemData[]>(initialPage.items);
  const [cursor, setCursor] = useState(initialPage.nextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [marking, startMarking] = useTransition();
  const { markAllRead } = useUnreadNotifications();

  const hasUnread = items.some((n) => n.read_at === null);

  async function handleLoadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchNotificationsPage(cursor);
      setItems((prev) => {
        // Guard against duplicates if a row shifted between requests.
        const seen = new Set(prev.map((n) => n.id));
        return [...prev, ...page.items.filter((n) => !seen.has(n.id))];
      });
      setCursor(page.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  function handleMarkAll() {
    markAllRead();
    startMarking(async () => {
      await markAllNotificationsRead();
      const readAt = new Date().toISOString();
      setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? readAt })));
      router.refresh();
    });
  }

  function renderMarkAllButton() {
    if (items.length === 0) return null;
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={!hasUnread || marking}
        onClick={handleMarkAll}
        className="gap-1.5 text-purple"
      >
        <CheckCheck className="size-4" aria-hidden />
        Tout marquer comme lu
      </Button>
    );
  }

  return (
    <>
      <PageHeading
        title="Notifications"
        subtitle="Ce qui bouge autour de vous et de vos contenus."
        actions={
          items.length > 0 ? (
            <div className="hidden md:block">{renderMarkAllButton()}</div>
          ) : null
        }
      />

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-2 md:gap-6">
          <div className="flex justify-end md:hidden">{renderMarkAllButton()}</div>
          <div className="flex flex-col gap-6">
            {groupNotifications(items, now).map((group) => (
              <section key={group.key} aria-labelledby={`notif-group-${group.key}`}>
                <h2
                  id={`notif-group-${group.key}`}
                  className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted"
                >
                  {group.label}
                </h2>
                <Card className="overflow-hidden p-0">
                  <ul className="divide-y divide-border/40">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <NotificationItem item={item} />
                      </li>
                    ))}
                  </ul>
                </Card>
              </section>
            ))}

            {cursor ? (
              <div className="flex justify-center py-2">
                <LoadMoreLink
                  label="Voir les notifications plus anciennes"
                  onClick={handleLoadMore}
                  pending={loadingMore}
                />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center py-6">
      <Card className="w-full max-w-md space-y-4 p-8 text-center">
        <div className="relative mx-auto aspect-4/3 min-h-32 w-full max-w-xs overflow-hidden rounded-2xl bg-warm">
          <CloudImage
            src={ILLUSTRATIONS.resident.notifications.emptyState}
            alt=""
            fill
            sizes="320px"
            className="object-contain"
          />
        </div>
        <h2 className="text-xl font-semibold leading-7 text-text">
          Rien de nouveau pour l&apos;instant
        </h2>
        <p className="text-sm text-muted">
          Dès qu&apos;un·e voisin·e publie ou réagit à vos contenus, vous le
          verrez ici.
        </p>
      </Card>
    </div>
  );
}
