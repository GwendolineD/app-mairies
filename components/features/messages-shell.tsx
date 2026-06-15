import { cn } from "@/lib/utils/cn";

/**
 * Two-column shell for the messages page.
 *
 * Mobile: a single column shows either the inbox list (`/messages`) or the
 * conversation pane (`/messages/[id]`).
 * Desktop (≥ md): both panels are side-by-side at all times.
 *
 * `mode` controls which side is visible on mobile so the same shell renders
 * cleanly on both routes without a flash.
 */
export function MessagesShell({
  list,
  pane,
  mode,
}: {
  list: React.ReactNode;
  pane: React.ReactNode;
  mode: "list" | "pane";
}) {
  return (
    <div className="grid h-[calc(100dvh-12rem)] min-h-[420px] w-full grid-cols-1 overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-card md:h-[calc(100dvh-9rem)] md:grid-cols-[340px_minmax(0,1fr)] lg:grid-cols-[380px_minmax(0,1fr)]">
      <aside
        className={cn(
          "min-h-0 min-w-0 border-border/60 md:flex md:flex-col md:border-r",
          mode === "list" ? "flex flex-col" : "hidden",
        )}
      >
        {list}
      </aside>
      <section
        className={cn(
          "min-h-0 min-w-0",
          mode === "pane" ? "flex flex-col" : "hidden md:flex md:flex-col",
        )}
      >
        {pane}
      </section>
    </div>
  );
}
