import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token";
import { APP_NAME } from "@/lib/constants/app";
import { ILLUSTRATIONS } from "@/lib/constants/illustrations";
import { ROUTES } from "@/lib/constants/routes";
import { createServiceClient } from "@/lib/supabase/server";
import { UnsubscribeButton } from "./unsubscribe-button";

function UnsubscribeShell({ children }: { children: React.ReactNode }) {
  const logo = ILLUSTRATIONS.auth.logoHorizontal;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
      {logo ? (
        <Link
          href={ROUTES.home}
          className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-purple/30"
          aria-label={`${APP_NAME} — Accueil`}
        >
          <Image
            src={logo}
            alt={`Logo ${APP_NAME}`}
            width={168}
            height={48}
            priority
            style={{ width: "auto" }}
            className="h-12 object-contain"
          />
        </Link>
      ) : null}
      {children}
    </div>
  );
}

export default async function UnsubscribePage(props: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await props.searchParams;

  if (!token) {
    return (
      <UnsubscribeShell>
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
      </UnsubscribeShell>
    );
  }

  const verified = verifyUnsubscribeToken(token);

  if (!verified) {
    return (
      <UnsubscribeShell>
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
      </UnsubscribeShell>
    );
  }

  const service = await createServiceClient();
  const { data: authData } = await service.auth.admin.getUserById(
    verified.userId,
  );
  const targetEmail = authData?.user?.email;

  return (
    <UnsubscribeShell>
      <Card className="max-w-md space-y-4 p-8 text-center">
        <h1 className="text-xl font-bold text-text">
          Désinscrire des emails de suivi
        </h1>
        <p className="text-sm text-muted">
          Vous ne recevrez plus les emails de rappel et relance (annonces
          expirées, invitations, etc.). Les notifications in-app resteront
          actives.
        </p>
        {targetEmail && (
          <p className="text-xs text-muted">
            Compte concerné :{" "}
            <span className="font-semibold text-text">{targetEmail}</span>
          </p>
        )}
        <UnsubscribeButton userId={verified.userId} />
      </Card>
    </UnsubscribeShell>
  );
}
