"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  appealSchema,
  reportSchema,
  userReportSchema,
} from "@/lib/validations/schemas";

export async function submitContentReport(formData: FormData): Promise<void> {
  const ctx = await requireActiveMembership();

  const raw = {
    contextType: formData.get("contextType") as string,
    contextId: formData.get("contextId") as string,
    reason: formData.get("reason") as string,
  };
  const parsed = reportSchema.safeParse(raw);
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_membership_id: ctx.activeMembership!.id,
    context_type: parsed.data.contextType,
    context_id: parsed.data.contextId,
    reason: parsed.data.reason,
  });

  if (error) return;
  revalidatePath("/", "layout");
}

export async function submitUserReport(formData: FormData): Promise<void> {
  const ctx = await requireActiveMembership();

  const raw = {
    reportedUserId: formData.get("reportedUserId") as string,
    reason: formData.get("reason") as string,
  };
  const parsed = userReportSchema.safeParse(raw);
  if (!parsed.success) return;

  if (parsed.data.reportedUserId === ctx.userId) return;

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_membership_id: ctx.activeMembership!.id,
    context_type: "user",
    context_id: parsed.data.reportedUserId,
    reason: parsed.data.reason,
  });

  if (error) return;
  revalidatePath(ROUTES.mairie.signalements);
  revalidatePath(ROUTES.backoffice.admin);
}

/** Stores structured appeal telemetry for moderator review using service_role. */
export async function submitSuspensionAppeal(formData: FormData): Promise<void> {
  const message = formData.get("message") as string;
  const parsed = appealSchema.safeParse({ message });
  if (!parsed.success) return;

  const ctx = await requireAuth();
  if (!ctx.profile.active_commune_id) return;

  const service = await createServiceClient();

  await service.from("analytics_events").insert({
    commune_id: ctx.profile.active_commune_id,
    user_id: ctx.userId,
    event_name: "suspension_appeal",
    properties: { message: parsed.data.message },
  });

  revalidatePath(ROUTES.suspendu);
}
