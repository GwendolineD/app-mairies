import type { MembershipRole } from "@/lib/types";

export const MEMBERSHIP_ROLES = {
  member: "member",
  staff: "staff",
  mayor: "mayor",
} as const satisfies Record<string, MembershipRole>;

export const COMMUNE_STAFF_ROLES: MembershipRole[] = [
  MEMBERSHIP_ROLES.staff,
  MEMBERSHIP_ROLES.mayor,
];

export const ROLE_LABELS: Record<MembershipRole, string> = {
  member: "Habitant",
  staff: "Employé mairie",
  mayor: "Maire",
};

export const PLATFORM_ADMIN_LABEL = "Super Admin";

export const ROLE_DESCRIPTIONS: Record<
  MembershipRole | "platform_admin",
  string
> = {
  member:
    "Peut consulter et publier des annonces, participer aux événements et initiatives de la commune.",
  staff:
    "Accès à l'espace mairie : gestion des annonces, événements, initiatives et modération des habitants.",
  mayor:
    "Tous les droits employé mairie, avec responsabilités étendues sur la gestion de la commune.",
  platform_admin:
    "Accès complet au backoffice plateforme : gestion de toutes les communes, utilisateurs et paramètres globaux.",
};

export const MEMBERSHIP_ROLE_OPTIONS: MembershipRole[] = [
  MEMBERSHIP_ROLES.member,
  MEMBERSHIP_ROLES.staff,
  MEMBERSHIP_ROLES.mayor,
];
