type PostgrestErrorLike =
  | {
      message?: string;
      code?: string;
      details?: string;
      hint?: string;
    }
  | null
  | undefined;

const POSTGREST_ERROR_BY_CODE: Record<string, string> = {
  "23503":
    "Catégorie non reconnue. Réessayez ou choisissez une autre catégorie.",
  "42501":
    "Vous n'avez pas l'autorisation d'effectuer cette action dans cette commune.",
  PGRST116:
    "Publication impossible. Vérifiez vos droits ou reconnectez-vous.",
  PGRST204:
    "La base de données n'est pas à jour. Réessayez dans quelques minutes ou contactez le support.",
};

const POSTGREST_ERROR_BY_MESSAGE: Array<{ match: RegExp; message: string }> = [
  {
    match: /address_street|address_city|address_citycode|address_postcode|schema cache/i,
    message:
      "Enregistrement de l'adresse impossible : la base de données doit être mise à jour. Réessayez dans quelques minutes ou contactez le support.",
  },
  {
    match: /row-level security|permission denied/i,
    message:
      "Vous n'avez pas l'autorisation de publier dans cette commune.",
  },
  {
    match: /author_membership must belong to commune_id|Invalid author_membership_id/i,
    message:
      "Votre adhésion à la commune est invalide. Reconnectez-vous ou changez de commune.",
  },
  {
    match: /violates foreign key|category_slug/i,
    message:
      "Catégorie non reconnue. Réessayez ou choisissez une autre catégorie.",
  },
];

function matchPostgrestMessage(message: string): string | undefined {
  const normalized = message.trim();
  if (!normalized) return undefined;

  for (const { match, message: frenchMessage } of POSTGREST_ERROR_BY_MESSAGE) {
    if (match.test(normalized)) return frenchMessage;
  }

  return undefined;
}

export function formatPostgrestError(
  error: PostgrestErrorLike,
  fallback: string,
): string {
  if (!error) return fallback;

  if (error.code && POSTGREST_ERROR_BY_CODE[error.code]) {
    return POSTGREST_ERROR_BY_CODE[error.code];
  }

  if (error.message) {
    return matchPostgrestMessage(error.message) ?? fallback;
  }

  return fallback;
}

export function firstZodIssueMessage(
  issues: Array<{ message: string }>,
  fallback = "Les données du formulaire sont invalides.",
): string {
  return issues[0]?.message ?? fallback;
}
