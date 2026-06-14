import { Skeleton } from "@/components/ui/skeleton";

export function MessagesInboxSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border/60 bg-surface px-2 pt-2 pb-2">
        <Skeleton className="h-9 flex-1 rounded-sm" />
        <Skeleton className="h-9 flex-1 rounded-sm" />
      </div>
      <ul className="flex-1 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <li
            key={i}
            className="flex items-start gap-3 border-b border-border/40 px-4 py-3"
          >
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ConversationPaneSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <Skeleton className="h-8 w-24 rounded-sm" />
      </div>
      <div className="flex-1 space-y-3 overflow-hidden px-4 py-4">
        <div className="flex justify-start">
          <Skeleton className="h-12 w-48 rounded-2xl" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-64 rounded-2xl" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-16 w-72 rounded-2xl" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-40 rounded-2xl" />
        </div>
      </div>
      <div className="border-t border-border/60 p-3">
        <Skeleton className="h-20 w-full rounded-sm" />
      </div>
    </div>
  );
}

export function ConversationEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="size-14 rounded-full bg-soft-pink" aria-hidden />
      <p className="text-base font-semibold text-text">
        Sélectionnez une conversation
      </p>
      <p className="max-w-sm text-sm text-muted">
        Vos échanges avec les voisin·es autour des annonces, initiatives et
        événements apparaissent ici.
      </p>
    </div>
  );
}
