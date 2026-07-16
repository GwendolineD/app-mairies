import { createServiceClient } from "@/lib/supabase/server";

/**
 * Cancel all pending email_queue entries related to a specific content.
 * Called when content is archived or deleted to prevent stale emails from being sent.
 */
export async function cancelPendingEmails(
  contentType: string,
  contentId: string,
): Promise<void> {
  const service = await createServiceClient();
  await service
    .from("email_queue")
    .update({ status: "cancelled" })
    .eq("related_content_type", contentType)
    .eq("related_content_id", contentId)
    .eq("status", "pending");
}
