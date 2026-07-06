"use client";

import { useEffect } from "react";
import { ErrorBoundaryCard } from "@/components/features/error-boundary-card";
import { ROUTES } from "@/lib/constants/routes";
import { useErrorReset } from "@/lib/hooks/use-error-reset";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const handleRetry = useErrorReset(reset);

  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="flex min-h-dvh items-center justify-center bg-background p-6">
        <ErrorBoundaryCard
          variant="plain"
          title="Une erreur inattendue s'est produite"
          description="Nous sommes désolés pour la gêne occasionnée. Réessayez ou revenez à l'accueil."
          homeHref={ROUTES.accueil}
          homeLabel="Retour à l'accueil"
          onRetry={handleRetry}
          retryButtonSize="default"
        />
      </body>
    </html>
  );
}
