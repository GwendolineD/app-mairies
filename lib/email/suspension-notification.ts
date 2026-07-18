import { getPlatformSupportEmail } from "@/lib/actions/platform-settings";
import { CONTEXT_TYPE_LABELS } from "@/lib/constants/context-types";
import { ROUTES } from "@/lib/constants/routes";
import { sendTemplatedEmail } from "@/lib/email/render-template";
import { createServiceClient } from "@/lib/supabase/server";
import type { ConversationContextType } from "@/lib/types";
import { getAppUrl } from "@/lib/utils/app-url";
import { formatDisplayName } from "@/lib/utils/display-name";

const CONTENT_TABLE_MAP = {
  announcement: "announcements",
  initiative: "initiatives",
  event: "events",
} as const satisfies Record<ConversationContextType, "announcements" | "initiatives" | "events">;

type UserRestorationContext = "membership" | "unban" | "all";

function buildContentUrl(type: ConversationContextType, contentId: string): string {
  const appUrl = getAppUrl();
  if (type === "announcement") return `${appUrl}${ROUTES.annonces.detail(contentId)}`;
  if (type === "initiative") return `${appUrl}${ROUTES.initiatives.detail(contentId)}`;
  return `${appUrl}${ROUTES.evenements.detail(contentId)}`;
}

function formatCommuneLabel(names: string[]): string {
  if (names.length === 0) return "votre commune";
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} et ${names[1]}`;
  return "l'ensemble de vos communes";
}

function buildRestorationSummary(
  context: UserRestorationContext,
  communeLabel: string,
): string {
  if (context === "unban") {
    return "Votre compte et l'ensemble de vos adhésions ont été rétablis.";
  }
  if (context === "all") {
    return `Votre accès à ${communeLabel} a été rétabli.`;
  }
  return `Votre accès à ${communeLabel} a été rétabli.`;
}

function buildRestorationAppUrl(context: UserRestorationContext): string {
  const appUrl = getAppUrl();
  if (context === "unban") return `${appUrl}${ROUTES.connexion}`;
  return `${appUrl}${ROUTES.accueil}`;
}

async function resolveCommuneNames(
  communeIds: string[],
): Promise<string[]> {
  const service = await createServiceClient();
  const { data: communes } = await service
    .from("communes")
    .select("name")
    .in("id", communeIds);
  return (communes ?? []).map((c) => c.name);
}

async function resolveUserEmailAndName(
  userId: string,
  userEmail?: string,
): Promise<{ email: string; userName: string } | null> {
  const service = await createServiceClient();

  let email = userEmail;
  if (!email) {
    const { data: authData, error: authError } =
      await service.auth.admin.getUserById(userId);
    if (authError || !authData?.user?.email) {
      console.error(
        "[moderation-email] User email not found:",
        userId,
        authError?.message,
      );
      return null;
    }
    email = authData.user.email;
  }

  const { data: profile } = await service
    .from("profiles")
    .select("first_name, last_name, display_name")
    .eq("user_id", userId)
    .maybeSingle();

  const userName =
    profile?.first_name && profile?.last_name
      ? formatDisplayName(profile.first_name, profile.last_name)
      : profile?.display_name?.trim() || "Voisin·e";

  return { email, userName };
}

async function sendModerationEmail(
  to: string,
  slug: string,
  variables: Record<string, string>,
): Promise<void> {
  const result = await sendTemplatedEmail(to, slug, variables);
  if (!result.success) {
    console.error(
      `[moderation-email] Failed to send "${slug}" to ${to}:`,
      result.error,
    );
  }
}

async function resolveContentAuthorRecipient(
  type: ConversationContextType,
  contentId: string,
): Promise<{
  recipient: { email: string; userName: string };
  content: { title: string; commune_id: string };
} | null> {
  const table = CONTENT_TABLE_MAP[type];
  const service = await createServiceClient();

  const { data: content, error: contentError } = await service
    .from(table)
    .select("title, commune_id, author_membership_id")
    .eq("id", contentId)
    .maybeSingle();

  if (contentError || !content) {
    console.error(
      "[moderation-email] Content not found:",
      type,
      contentId,
      contentError?.message,
    );
    return null;
  }

  const { data: membership, error: membershipError } = await service
    .from("memberships")
    .select("user_id")
    .eq("id", content.author_membership_id)
    .maybeSingle();

  if (membershipError || !membership?.user_id) {
    console.error(
      "[moderation-email] Author membership not found:",
      content.author_membership_id,
      membershipError?.message,
    );
    return null;
  }

  const recipient = await resolveUserEmailAndName(membership.user_id);
  if (!recipient) return null;

  return { recipient, content };
}

export async function notifyContentSuspended(params: {
  type: ConversationContextType;
  contentId: string;
  reason: string;
}): Promise<void> {
  const { type, contentId, reason } = params;
  const resolved = await resolveContentAuthorRecipient(type, contentId);
  if (!resolved) return;

  const service = await createServiceClient();
  const { data: commune } = await service
    .from("communes")
    .select("name")
    .eq("id", resolved.content.commune_id)
    .maybeSingle();

  const supportEmail = await getPlatformSupportEmail();
  const contentTypeLabel = CONTEXT_TYPE_LABELS[type].toLowerCase();

  await sendModerationEmail(resolved.recipient.email, "content-suspended", {
    user_name: resolved.recipient.userName,
    commune_name: commune?.name ?? "Commune",
    content_type: contentTypeLabel,
    content_title: resolved.content.title,
    suspension_reason: reason,
    content_url: buildContentUrl(type, contentId),
    support_email: supportEmail,
  });
}

export async function notifyContentRestored(params: {
  type: ConversationContextType;
  contentId: string;
}): Promise<void> {
  const { type, contentId } = params;
  const resolved = await resolveContentAuthorRecipient(type, contentId);
  if (!resolved) return;

  const service = await createServiceClient();
  const { data: commune } = await service
    .from("communes")
    .select("name")
    .eq("id", resolved.content.commune_id)
    .maybeSingle();

  const supportEmail = await getPlatformSupportEmail();
  const contentTypeLabel = CONTEXT_TYPE_LABELS[type].toLowerCase();

  await sendModerationEmail(resolved.recipient.email, "content-restored", {
    user_name: resolved.recipient.userName,
    commune_name: commune?.name ?? "Commune",
    content_type: contentTypeLabel,
    content_title: resolved.content.title,
    content_url: buildContentUrl(type, contentId),
    support_email: supportEmail,
  });
}

export async function notifyUserSuspended(params: {
  userId: string;
  reason: string;
  scope: "single" | "all";
  communeId?: string;
  communeIds?: string[];
  userEmail?: string;
}): Promise<void> {
  const { userId, reason, scope, communeId, communeIds, userEmail } = params;
  const recipient = await resolveUserEmailAndName(userId, userEmail);
  if (!recipient) return;

  const service = await createServiceClient();
  const supportEmail = await getPlatformSupportEmail();
  const appUrl = getAppUrl();

  let communeNames: string[] = [];

  if (scope === "single" && communeId) {
    const { data: commune } = await service
      .from("communes")
      .select("name")
      .eq("id", communeId)
      .maybeSingle();
    communeNames = commune?.name ? [commune.name] : [];
  } else if (scope === "all" && communeIds?.length) {
    const { data: communes } = await service
      .from("communes")
      .select("name")
      .in("id", communeIds);
    communeNames = (communes ?? []).map((c) => c.name);
  }

  await sendModerationEmail(recipient.email, "user-suspended", {
    user_name: recipient.userName,
    commune_name: formatCommuneLabel(communeNames),
    suspension_reason: reason,
    appeal_url: `${appUrl}${ROUTES.suspendu}`,
    support_email: supportEmail,
  });
}

export async function notifyUserBanned(params: {
  userId: string;
  reason: string;
  userEmail?: string;
}): Promise<void> {
  const { userId, reason, userEmail } = params;
  const recipient = await resolveUserEmailAndName(userId, userEmail);
  if (!recipient) return;

  const supportEmail = await getPlatformSupportEmail();

  await sendModerationEmail(recipient.email, "user-banned", {
    user_name: recipient.userName,
    ban_reason: reason,
    support_email: supportEmail,
  });
}

export async function notifyUserRestored(params: {
  userId: string;
  context: UserRestorationContext;
  communeId?: string;
  communeIds?: string[];
  userEmail?: string;
}): Promise<void> {
  const { userId, context, communeId, communeIds, userEmail } = params;
  const recipient = await resolveUserEmailAndName(userId, userEmail);
  if (!recipient) return;

  const service = await createServiceClient();
  const supportEmail = await getPlatformSupportEmail();

  let communeLabel = "votre commune";
  if (context === "all" && communeIds?.length) {
    const names = await resolveCommuneNames(communeIds);
    communeLabel = formatCommuneLabel(names);
  } else if (context === "membership" && communeId) {
    const { data: commune } = await service
      .from("communes")
      .select("name")
      .eq("id", communeId)
      .maybeSingle();
    communeLabel = commune?.name ?? communeLabel;
  }

  await sendModerationEmail(recipient.email, "user-restored", {
    user_name: recipient.userName,
    restoration_summary: buildRestorationSummary(context, communeLabel),
    app_url: buildRestorationAppUrl(context),
    support_email: supportEmail,
  });
}
