"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { RelativeTime } from "@/components/ui/relative-time";
import { markNotificationRead } from "@/lib/actions/notifications";
import { CONTENT_STATUS_LABELS } from "@/lib/constants/content-status";
import {
  buildNotificationHref,
  getNotificationVisual,
} from "@/lib/constants/notification-kinds";
import type { NotificationItem as NotificationItemData } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  item: NotificationItemData;
  /** Tighter layout for the header popover. */
  compact?: boolean;
  /** Called after a navigable row is clicked (e.g. to close the popover). */
  onNavigate?: () => void;
};

/**
 * One notification row. Navigable rows are links to the related content;
 * rows whose content is no longer reachable render as static text with a
 * status badge, mirroring the messages inbox.
 */
export function NotificationItem({ item, compact = false, onNavigate }: Props) {
  // Optimistic read state: flip locally, persist in the background.
  // Derived from props so a parent-level "mark all read" is reflected too.
  const [readLocally, setReadLocally] = useState(false);
  const isRead = item.read_at !== null || readLocally;
  const [, startTransition] = useTransition();

  const href = buildNotificationHref(item);
  const visual = getNotificationVisual(item);
  const Icon = visual.icon;
  const statusLabel =
    item.context_status !== "available"
      ? CONTENT_STATUS_LABELS[item.context_status]
      : null;

  function handleClick() {
    if (!isRead) {
      setReadLocally(true);
      startTransition(() => {
        void markNotificationRead(item.id);
      });
    }
    onNavigate?.();
  }

  const content = (
    <div className={cn("flex items-start gap-3", compact ? "px-3 py-2.5" : "px-4 py-3")}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full",
          compact ? "size-8" : "size-10",
          visual.className,
        )}
        aria-hidden
      >
        <Icon className={compact ? "size-4" : "size-5"} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "min-w-0 flex-1 text-sm leading-5",
              isRead ? "font-medium text-muted" : "font-semibold text-text",
              compact && "truncate",
            )}
          >
            {item.title ?? "Notification"}
          </p>
          <span className="flex shrink-0 items-center gap-1.5 pt-0.5">
            <RelativeTime
              iso={item.created_at}
              className="text-[11px] font-medium text-subtle"
            />
            {!isRead ? (
              <span
                className="size-2 rounded-full bg-coral"
                aria-label="Non lue"
              />
            ) : null}
          </span>
        </div>

        {item.body ? (
          <p
            className={cn(
              "mt-0.5 text-xs leading-4 text-muted",
              compact ? "truncate" : "line-clamp-2",
            )}
          >
            {item.body}
          </p>
        ) : null}

        {statusLabel ? (
          <span className="mt-1.5 inline-flex rounded-full bg-coral/10 px-1.5 py-0.5 text-[9px] font-bold text-coral">
            {statusLabel}
          </span>
        ) : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={handleClick}
        className={cn(
          "block min-h-11 cursor-pointer outline-none transition hover:bg-warm/60 focus-visible:bg-warm",
          !isRead && "bg-soft-pink/40",
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      className={cn("min-h-11", !isRead && "bg-soft-pink/40")}
      aria-disabled="true"
    >
      {content}
    </div>
  );
}
