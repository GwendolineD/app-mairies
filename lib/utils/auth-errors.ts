type AuthErrorLike =
  | {
      message?: string;
      code?: string;
    }
  | string
  | null
  | undefined;

const AUTH_ERROR_BY_CODE: Record<string, string> = {
  user_already_exists:
    "Un compte existe déjà avec cette adresse e-mail. Connectez-vous ou utilisez une autre adresse.",
  email_exists:
    "Un compte existe déjà avec cette adresse e-mail. Connectez-vous ou utilisez une autre adresse.",
  invalid_credentials:
    "E-mail ou mot de passe incorrect. Vérifiez vos identifiants et réessayez.",
  email_not_confirmed:
    "Confirmez votre adresse e-mail avant de vous connecter. Consultez votre boîte de réception.",
  weak_password:
    "Le mot de passe est trop faible. Utilisez au moins 8 caractères avec des lettres et des chiffres.",
  over_email_send_rate_limit:
    "Trop de demandes envoyées. Patientez quelques instants et réessayez.",
  over_request_rate_limit:
    "Trop de tentatives. Patientez quelques instants et réessayez.",
  same_password:
    "Le nouveau mot de passe doit être différent de l'ancien.",
  signup_disabled:
    "Les inscriptions sont momentanément indisponibles. Réessayez plus tard.",
  validation_failed: "Les informations saisies sont invalides. Vérifiez et réessayez.",
};

const AUTH_ERROR_BY_MESSAGE: Array<{ match: RegExp; message: string }> = [
  {
    match: /already registered|user already exists|email already/i,
    message:
      "Un compte existe déjà avec cette adresse e-mail. Connectez-vous ou utilisez une autre adresse.",
  },
  {
    match: /invalid login credentials|invalid credentials/i,
    message:
      "E-mail ou mot de passe incorrect. Vérifiez vos identifiants et réessayez.",
  },
  {
    match: /email not confirmed|confirm your email/i,
    message:
      "Confirmez votre adresse e-mail avant de vous connecter. Consultez votre boîte de réception.",
  },
  {
    match: /password.*(weak|short|least)/i,
    message:
      "Le mot de passe est trop faible. Utilisez au moins 8 caractères avec des lettres et des chiffres.",
  },
  {
    match: /invalid email|validate email/i,
    message: "Adresse e-mail invalide. Vérifiez le format et réessayez.",
  },
  {
    match: /rate limit|too many requests|once every/i,
    message: "Trop de tentatives. Patientez quelques instants et réessayez.",
  },
  {
    match: /recovery.*expired|otp.*expired|expired.*token/i,
    message: "Ce lien a expiré. Demandez-en un nouveau.",
  },
  {
    match: /signup.*disabled|signups not allowed/i,
    message: "Les inscriptions sont momentanément indisponibles. Réessayez plus tard.",
  },
];

function matchAuthMessage(message: string): string | undefined {
  const normalized = message.trim();
  if (!normalized) return undefined;

  for (const { match, message: frenchMessage } of AUTH_ERROR_BY_MESSAGE) {
    if (match.test(normalized)) return frenchMessage;
  }

  return undefined;
}

export function formatAuthError(
  error: AuthErrorLike,
  fallback: string,
): string {
  if (!error) return fallback;

  if (typeof error === "string") {
    return matchAuthMessage(error) ?? fallback;
  }

  if (error.code && AUTH_ERROR_BY_CODE[error.code]) {
    return AUTH_ERROR_BY_CODE[error.code];
  }

  if (error.message) {
    return matchAuthMessage(error.message) ?? fallback;
  }

  return fallback;
}
