import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export async function logModerationReactivate(
  supabase: ServerClient,
  entry: {
    actorUserId: string;
    targetType: string;
    targetId: string;
    communeId: string;
  },
): Promise<boolean> {
  const { error } = await supabase.from("moderation_actions").insert({
    actor_user_id: entry.actorUserId,
    target_type: entry.targetType as "announcement" | "initiative" | "event" | "membership",
    target_id: entry.targetId,
    commune_id: entry.communeId,
    action: "reactivate",
    reason: null,
  });

  if (error) {
    console.error(
      "[moderation] Failed to log reactivate action:",
      error.message,
      error.code,
    );
    return false;
  }

  return true;
}
