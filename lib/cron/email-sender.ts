import type { SupabaseClient } from "@supabase/supabase-js";

import { sendTemplatedEmail } from "@/lib/email/render-template";

type SenderResult = {
  sent: number;
  failed: number;
  cancelled: number;
  skipped?: boolean;
};

const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_DELAY_MS = 500;

function getBatchSize(): number {
  const val = process.env.CRON_EMAIL_BATCH_SIZE;
  return val ? Math.max(1, parseInt(val, 10) || DEFAULT_BATCH_SIZE) : DEFAULT_BATCH_SIZE;
}

function getDelayMs(): number {
  const val = process.env.CRON_EMAIL_DELAY_MS;
  if (!val) return DEFAULT_DELAY_MS;
  const parsed = parseInt(val, 10);
  return !isNaN(parsed) ? Math.max(0, parsed) : DEFAULT_DELAY_MS;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Re-verify email preference before sending.
 *
 * - `recipient_user_id` null → no account (invitation), send.
 * - `recipient_user_id` set → check opt-out, send if allowed.
 */
async function shouldSend(
  service: SupabaseClient,
  recipientUserId: string | null,
): Promise<boolean> {
  // No account (invitation recipients) — send unconditionally
  if (!recipientUserId) return true;

  const { data: pref } = await service
    .from("user_notification_preferences")
    .select("email_lifecycle_enabled")
    .eq("user_id", recipientUserId)
    .maybeSingle();

  // Default to true if no preferences row
  return pref?.email_lifecycle_enabled ?? true;
}

export async function runEmailSender(service: SupabaseClient): Promise<SenderResult> {
  // Acquire single-writer lock to prevent concurrent runs from processing the same emails
  const { data: lockId } = await service.rpc("try_acquire_cron_lock", {
    p_name: "email_sender",
  });

  if (!lockId) {
    return { sent: 0, failed: 0, cancelled: 0, skipped: true };
  }

  try {
    const batchSize = getBatchSize();
    const delayMs = getDelayMs();
    const now = new Date().toISOString();

    const { data: entries, error } = await service
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(batchSize);

    if (error) throw new Error(`runEmailSender(fetch): ${error.message}`);
    if (!entries || entries.length === 0) return { sent: 0, failed: 0, cancelled: 0 };

    let sent = 0;
    let failed = 0;
    let cancelled = 0;

    for (const entry of entries) {
      // Re-verify opt-in before sending (recipient_user_id null = no account, always send)
      const allowed = await shouldSend(service, entry.recipient_user_id);
      if (!allowed) {
        await service
          .from("email_queue")
          .update({ status: "cancelled" })
          .eq("id", entry.id);
        cancelled++;
        continue;
      }

      const result = await sendTemplatedEmail(
        entry.to_email,
        entry.template_slug,
        entry.variables as Record<string, string>,
      );

      if (result.success) {
        await service
          .from("email_queue")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", entry.id);
        sent++;
      } else {
        const newAttempts = (entry.attempts ?? 0) + 1;
        const newStatus = newAttempts >= (entry.max_attempts ?? 3) ? "failed" : "pending";
        await service
          .from("email_queue")
          .update({
            attempts: newAttempts,
            last_error: result.error ?? "Unknown",
            status: newStatus,
          })
          .eq("id", entry.id);
        if (newStatus === "failed") failed++;
      }

      if (delayMs > 0) await sleep(delayMs);
    }

    return { sent, failed, cancelled };
  } finally {
    // Release the lock, passing our lock_id to prevent releasing a lock stolen by TTL
    await service.rpc("release_cron_lock", {
      p_name: "email_sender",
      p_lock_id: lockId,
    });
  }
}
