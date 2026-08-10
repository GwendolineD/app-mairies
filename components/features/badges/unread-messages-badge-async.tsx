import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { countUnreadMessages } from "@/lib/queries/messages";

export const getCachedUnreadMessagesCount = cache(async (communeId: string) => {
  const supabase = await createClient();
  return countUnreadMessages(supabase, communeId);
});

type Variant = "sidebar-pill" | "sidebar-dot" | "bottom-pill";

function UnreadBadgeVisual({
  count,
  variant,
}: {
  count: number;
  variant: Variant;
}) {
  if (count <= 0) return null;

  if (variant === "sidebar-dot") {
    return (
      <span className="absolute top-1 right-1 flex size-2.5 rounded-full bg-coral" />
    );
  }

  if (variant === "bottom-pill") {
    return (
      <span className="absolute -top-1 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-coral text-[8px] font-bold leading-none text-white">
        {count > 9 ? "9+" : count}
      </span>
    );
  }

  return (
    <span
      aria-label={`${count} non lus`}
      className="flex size-5 items-center justify-center rounded-full bg-coral text-[10px] font-bold text-white"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** Server component — await count then render badge visual for the given nav variant. */
export async function UnreadMessagesBadgeAsync({
  communeId,
  variant,
}: {
  communeId: string;
  variant: Variant;
}) {
  const count = await getCachedUnreadMessagesCount(communeId);
  return <UnreadBadgeVisual count={count} variant={variant} />;
}
