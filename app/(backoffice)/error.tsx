"use client";

import { useEffect } from "react";
import { ErrorBoundaryCard } from "@/components/features/error-boundary-card";
import { ROUTES } from "@/lib/constants/routes";
import { useErrorReset } from "@/lib/hooks/use-error-reset";

export default function BackofficeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const handleRetry = useErrorReset(reset);

  useEffect(() => {
    console.error("[backoffice-error]", error);
  }, [error]);

  return (
    <ErrorBoundaryCard
      title="Une erreur est survenue dans le backoffice"
      description="Réessayez dans un instant ou revenez au tableau de bord."
      homeHref={ROUTES.backoffice.admin}
      homeLabel="Retour au tableau de bord"
      onRetry={handleRetry}
    />
  );
}
