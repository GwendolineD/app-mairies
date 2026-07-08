export const AUDIT_CATEGORIES = [
  "auth",
  "moderation",
  "content",
  "admin",
  "billing",
] as const;

export type AuditCategoryValue = (typeof AUDIT_CATEGORIES)[number];

export const AUDIT_SEVERITIES = ["critical", "warning", "info"] as const;

export type AuditSeverityValue = (typeof AUDIT_SEVERITIES)[number];

export const AUDIT_DEVICE_TYPES = ["mobile", "tablet", "desktop"] as const;

export const BACKOFFICE_AUDIT_PAGE_SIZES = [25, 50, 100] as const;
export const DEFAULT_BACKOFFICE_AUDIT_PAGE_SIZE = 50;

export const AUDIT_CATEGORY_LABELS: Record<AuditCategoryValue, string> = {
  auth: "Authentification",
  moderation: "Modération",
  content: "Contenu",
  admin: "Administration",
  billing: "Facturation",
};

export const AUDIT_SEVERITY_LABELS: Record<AuditSeverityValue, string> = {
  critical: "Critique",
  warning: "Attention",
  info: "Info",
};

export const AUDIT_SEVERITY_STYLES: Record<AuditSeverityValue, string> = {
  critical: "bg-coral/10 text-coral",
  warning: "bg-orange/10 text-orange",
  info: "bg-purple/10 text-purple",
};

export const AUDIT_CATEGORY_STYLES: Record<AuditCategoryValue, string> = {
  auth: "bg-turquoise/10 text-turquoise",
  moderation: "bg-orange/10 text-orange",
  content: "bg-mint/10 text-mint",
  admin: "bg-magenta/10 text-magenta",
  billing: "bg-sun/10 text-sun",
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  "auth.sign_up": "Inscription",
  "auth.sign_in": "Connexion",
  "auth.sign_in_failed": "Échec de connexion",
  "auth.sign_out": "Déconnexion",
  "auth.change_password": "Changement mot de passe",
  "auth.reset_password": "Réinitialisation mot de passe",
  "auth.request_password_reset": "Demande reset mot de passe",
  "auth.request_email_change": "Demande changement email",
  "auth.join_commune": "Adhésion commune",
  "moderation.suspend_content": "Suspension contenu",
  "moderation.reactivate_content": "Réactivation contenu",
  "moderation.suspend_membership": "Suspension adhésion",
  "moderation.reactivate_membership": "Réactivation adhésion",
  "moderation.ban_user": "Bannissement utilisateur",
  "moderation.unban_user": "Débannissement utilisateur",
  "moderation.suspend_membership_admin": "Suspension adhésion (admin)",
  "moderation.suspend_all_communes": "Suspension toutes communes",
  "moderation.report_content": "Signalement contenu",
  "moderation.report_user": "Signalement utilisateur",
  "moderation.resolve_report": "Résolution signalement",
  "admin.delete_user_account": "Suppression compte (admin)",
  "auth.delete_own_account": "Suppression de compte",
  "admin.change_role": "Changement de rôle",
  "admin.set_commune_status": "Changement statut commune",
  "admin.delete_announcement": "Suppression annonce (admin)",
  "admin.update_legal_document": "Mise à jour document juridique",
  "admin.update_platform_settings": "Mise à jour réglages plateforme",
  "admin.update_email_template": "Mise à jour template email",
  "admin.update_commune_info": "Mise à jour infos commune",
  "admin.update_commune_settings": "Mise à jour paramètres commune",
  "billing.cancel_subscription": "Résiliation abonnement",
  "billing.mark_paid": "Marquage paiement",
  "billing.delete_period": "Suppression période abonnement",
  "content.create_announcement": "Création annonce",
  "content.update_announcement": "Modification annonce",
  "content.delete_announcement": "Suppression annonce",
  "content.create_initiative": "Création initiative",
  "content.update_initiative": "Modification initiative",
  "content.delete_initiative": "Suppression initiative",
  "content.create_event": "Création événement",
  "content.update_event": "Modification événement",
  "content.delete_event": "Suppression événement",
};

export function getAuditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}
