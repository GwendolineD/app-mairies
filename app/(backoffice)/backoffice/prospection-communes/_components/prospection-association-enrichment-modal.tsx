"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { ProspectAssociationEnrichmentResult } from "@/lib/services/prospect-association-enrichment";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  result: ProspectAssociationEnrichmentResult | null;
  onApplyAssociation: (value: number) => void;
};

export function ProspectionAssociationEnrichmentModal({
  open,
  onClose,
  loading,
  result,
  onApplyAssociation,
}: ModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Associations recensées"
      size="md"
      elevated
      footer={
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Fermer
        </Button>
      }
    >
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Recherche en cours…
        </div>
      ) : null}

      {!loading && result?.errors.length ? (
        <ul className="space-y-1 text-sm text-coral">
          {result.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      {!loading && result?.associationCount != null ? (
        <div className="space-y-3">
          <p className="text-sm text-text">{result.associationLabel}</p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="cursor-pointer"
            onClick={() => {
              onApplyAssociation(result.associationCount!);
              onClose();
              toast.success("Nombre d'associations appliqué.");
            }}
          >
            Utiliser ce nombre
          </Button>
          <p className="text-xs text-muted">
            Source API publique — le chiffre reste éditable manuellement.
          </p>
        </div>
      ) : null}

      {!loading &&
      result &&
      result.associationCount == null &&
      result.errors.length === 0 ? (
        <p className="text-sm text-muted">Aucun résultat.</p>
      ) : null}
    </Modal>
  );
}

export function useProspectionAssociationEnrichmentModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] =
    useState<ProspectAssociationEnrichmentResult | null>(null);

  async function fetchEnrichment(prospectCommuneId: string) {
    setOpen(true);
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `/api/backoffice/prospect-communes/${prospectCommuneId}/enrichment`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as
        | ProspectAssociationEnrichmentResult
        | { error?: string };

      if (!response.ok) {
        const message =
          "error" in payload && payload.error
            ? payload.error
            : "Recherche impossible.";
        setResult({ errors: [message] });
        return;
      }

      setResult(payload as ProspectAssociationEnrichmentResult);
    } catch {
      setResult({ errors: ["Recherche impossible."] });
    } finally {
      setLoading(false);
    }
  }

  return {
    open,
    setOpen,
    loading,
    result,
    fetchEnrichment,
  };
}
