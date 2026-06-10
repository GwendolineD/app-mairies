"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { fetchAnnouncementsPage } from "@/lib/actions/announcements";
import type { AnnouncementWithAuthor } from "@/lib/queries/announcements";
import { AnnouncementCard } from "@/components/features/announcement-card";

type Props = {
  initialItems: AnnouncementWithAuthor[];
  initialCursor: string | null;
  filters: { type?: string; categorie?: string };
};

export function AnnouncementsInfiniteList({
  initialItems,
  initialCursor,
  filters,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [pending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(initialItems);
    setCursor(initialCursor);
  }, [initialItems, initialCursor, filters.type, filters.categorie]);

  useEffect(() => {
    if (!cursor) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || pending || !cursor) return;
        startTransition(async () => {
          const result = await fetchAnnouncementsPage(cursor, filters);
          setItems((prev) => [...prev, ...result.items]);
          setCursor(result.nextCursor);
        });
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, filters, pending]);

  return (
    <div className="space-y-3 md:hidden">
      {items.map((a) => (
        <AnnouncementCard key={a.id} announcement={a} layout="horizontal" />
      ))}
      {cursor ? (
        <div ref={sentinelRef} className="py-4 text-center text-sm text-muted">
          {pending ? "Chargement…" : ""}
        </div>
      ) : null}
    </div>
  );
}

/** Generic infinite list wrapper for other content types. */
export function InfiniteScrollSentinel({
  hasMore,
  loading,
  onLoadMore,
}: {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading) onLoadMore();
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (!hasMore) return null;

  return (
    <div ref={sentinelRef} className="py-4 text-center text-sm text-muted">
      {loading ? "Chargement…" : ""}
    </div>
  );
}
