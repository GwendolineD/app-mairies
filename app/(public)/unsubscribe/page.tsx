import Link from "next/link";
import { Card } from "@/components/ui/card";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token";
import { ROUTES } from "@/lib/constants/routes";
import { UnsubscribeButton } from "./unsubscribe-button";

export default async function UnsubscribePage(props: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await props.searchParams;

  if (!token) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <Card className="max-w-md space-y-4 p-8 text-center">
          <h1 className="text-xl font-bold text-text">Lien invalide</h1>
          <p className="text-sm text-muted">
            Ce lien de désinscription est invalide ou a expiré.
          </p>
          <Link
            href={ROUTES.connexion}
            className="text-sm font-medium text-purple hover:underline"
          >
            Se connecter pour gérer mes préférences
          </Link>
        </Card>
      </div>
    );
  }

  const verified = verifyUnsubscribeToken(token);

  if (!verified) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <Card className="max-w-md space-y-4 p-8 text-center">
          <h1 className="text-xl font-bold text-text">Lien expiré</h1>
          <p className="text-sm text-muted">
            Ce lien de désinscription a expiré. Connectez-vous pour gérer vos
            préférences de notification.
          </p>
          <Link
            href={ROUTES.connexion}
            className="text-sm font-medium text-purple hover:underline"
          >
            Se connecter
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="max-w-md space-y-4 p-8 text-center">
        <h1 className="text-xl font-bold text-text">
          Désinscrire des emails de suivi
        </h1>
        <p className="text-sm text-muted">
          Vous ne recevrez plus les emails de rappel et relance (annonces
          expirées, invitations, etc.). Les notifications in-app resteront
          actives.
        </p>
        <UnsubscribeButton userId={verified.userId} />
        <Link
          href={ROUTES.profil}
          className="block text-sm font-medium text-purple hover:underline"
        >
          Gérer toutes mes préférences
        </Link>
      </Card>
    </div>
  );
}
