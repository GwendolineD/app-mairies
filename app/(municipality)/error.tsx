"use client";

import { useEffect } from "react";
import { ErrorBoundaryCard } from "@/components/features/error-boundary-card";
import { ROUTES } from "@/lib/constants/routes";
import { useErrorReset } from "@/lib/hooks/use-error-reset";

export default function MunicipalityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const handleRetry = useErrorReset(reset);

  useEffect(() => {
    console.error("[municipality-error]", error);
  }, [error]);

  return (
    <ErrorBoundaryCard
      title="Le tableau de bord est momentanément indisponible"
      description="Une erreur est survenue. Réessayez dans un instant ou revenez au tableau de bord."
      homeHref={ROUTES.mairie.dashboard}
      homeLabel="Retour au tableau de bord"
      onRetry={handleRetry}
    />
  );
}
