import { APP_NAME } from "@/lib/constants/app";
import { ROUTES } from "@/lib/constants/routes";
import { sendEmail } from "@/lib/email/send-email";
import { createServiceClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/utils/app-url";

type SupportRequestNotificationInput = {
  id: string;
  subject: string;
  message: string;
  userEmail: string;
  firstName: string | null;
  lastName: string | null;
  communeName: string;
  createdAt: string;
};

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function displayName(firstName: string | null, lastName: string | null): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Non renseigné";
}

export async function sendSupportRequestNotification(
  input: SupportRequestNotificationInput,
): Promise<void> {
  const serviceClient = await createServiceClient();

  const { data: settings } = await serviceClient
    .from("platform_settings")
    .select("support_email")
    .eq("id", 1)
    .single();

  const supportEmail = settings?.support_email ?? "contact@tous-voisins.fr";
  const appUrl = getAppUrl();
  const backofficeUrl = `${appUrl}${ROUTES.backoffice.assistance}`;
  const fullName = displayName(input.firstName, input.lastName);
  const sentAt = formatDateTime(input.createdAt);

  const text = [
    `Nouvelle demande d'assistance ${APP_NAME}`,
    "",
    `Objet : ${input.subject}`,
    "",
    "Message :",
    input.message,
    "",
    `De : ${fullName} <${input.userEmail}>`,
    `Commune : ${input.communeName}`,
    `Envoyé le : ${sentAt}`,
    `Réf. ticket : ${input.id}`,
    "",
    `Voir dans le backoffice : ${backofficeUrl}`,
  ].join("\n");

  const html = `
    <h2>Nouvelle demande d'assistance ${APP_NAME}</h2>
    <p><strong>Objet :</strong> ${escapeHtml(input.subject)}</p>
    <p><strong>Message :</strong></p>
    <p>${escapeHtml(input.message).replace(/\n/g, "<br>")}</p>
    <hr>
    <p><strong>De :</strong> ${escapeHtml(fullName)} &lt;${escapeHtml(input.userEmail)}&gt;</p>
    <p><strong>Commune :</strong> ${escapeHtml(input.communeName)}</p>
    <p><strong>Envoyé le :</strong> ${escapeHtml(sentAt)}</p>
    <p><strong>Réf. ticket :</strong> ${escapeHtml(input.id)}</p>
    <p><a href="${escapeHtml(backofficeUrl)}">Ouvrir dans le backoffice</a></p>
  `.trim();

  await sendEmail({
    to: supportEmail,
    subject: `[Assistance] ${input.subject} — ${input.communeName}`,
    html,
    text,
    replyTo: input.userEmail,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
