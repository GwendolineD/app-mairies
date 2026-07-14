"use server";

import { createServiceClient } from "@/lib/supabase/server";

export async function unsubscribeFromEmails(
  userId: string,
): Promise<{ success: boolean }> {
  const service = await createServiceClient();

  const { error } = await service
    .from("user_notification_preferences")
    .upsert(
      { user_id: userId, email_lifecycle_enabled: false },
      { onConflict: "user_id" },
    );

  if (error) {
    console.error("[unsubscribe] Error:", error.message);
    return { success: false };
  }

  return { success: true };
}
