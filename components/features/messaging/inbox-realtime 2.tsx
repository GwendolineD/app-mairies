"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Keeps the inbox list fresh: any new message notification for the current user
 * re-runs the server component (re-ordering + unread counts) via router.refresh.
 */
export function InboxRealtime({ currentUserId }: { currentUserId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const channel = supabase
      .channel(`inbox:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        () => {
          if (active) router.refresh();
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [currentUserId, router]);

  return null;
}
