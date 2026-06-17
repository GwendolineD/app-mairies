"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { fetchInitiativesPage } from "@/lib/actions/initiatives";
import type { InitiativeWithAuthor } from "@/lib/queries/initiatives";
import { InitiativeCard } from "@/components/features/initiative-card";

type Props = {
  initialItems: InitiativeWithAuthor[];
  initialCursor: string | null;
  filters: {
    categorie?: string;
  };
};

export function InitiativesInfiniteList({
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
  }, [initialItems, initialCursor, filters.categorie]);

  useEffect(() => {
    if (!cursor) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || pending || !cursor) return;
        startTransition(async () => {
          const result = await fetchInitiativesPage(cursor, filters);
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
      {items.map((item) => (
        <InitiativeCard key={item.id} initiative={item} layout="horizontal" />
      ))}
      {cursor ? (
        <div ref={sentinelRef} className="py-4 text-center text-sm text-muted">
          {pending ? "Chargement…" : ""}
        </div>
      ) : null}
    </div>
  );
}
