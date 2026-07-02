"use client";

import { useEffect } from "react";
import { ErrorBoundaryCard } from "@/components/features/error-boundary-card";
import { ROUTES } from "@/lib/constants/routes";
import { useErrorReset } from "@/lib/hooks/use-error-reset";

export default function ResidentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const handleRetry = useErrorReset(reset);

  useEffect(() => {
    console.error("[resident-error]", error);
  }, [error]);

  return (
    <ErrorBoundaryCard
      title="Impossible de charger cette page"
      description="Un problème est survenu. Réessayez dans un instant ou revenez à l'accueil."
      homeHref={ROUTES.accueil}
      homeLabel="Retour à l'accueil"
      onRetry={handleRetry}
    />
  );
}
