"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { BanAutocomplete } from "@/components/features/ban-autocomplete";
import { createPilotCommuneAction } from "@/lib/actions/platform";
import type { BanFeature } from "@/lib/ban/client";
import { searchAddresses, searchMunicipalities } from "@/lib/ban/client";
import { formatMunicipalityDisplay } from "@/lib/ban/display";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL_ACCESS_STATUSES,
  ACCESS_STATUS,
  ACCESS_STATUS_LABELS,
} from "@/lib/constants/access-status";
import { ROUTES } from "@/lib/constants/routes";
import type { Commune, AccessStatus } from "@/lib/types";

type LookupResponse = { commune: Commune | null; error?: string };

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AddCommuneModal({ open, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [communeFeature, setCommuneFeature] = useState<BanFeature | null>(null);
  const [postcode, setPostcode] = useState("");
  const [mairieAddress, setMairieAddress] = useState("");
  const [accessStatus, setAccessStatus] = useState<AccessStatus>(
    ACCESS_STATUS.inactive,
  );
  const [lookupLoading, setLookupLoading] = useState(false);
  const [duplicateCommuneId, setDuplicateCommuneId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setCommuneFeature(null);
    setPostcode("");
    setMairieAddress("");
    setAccessStatus(ACCESS_STATUS.inactive);
    setLookupLoading(false);
    setDuplicateCommuneId(null);
    setError(null);
  }, []);

  function handleClose() {
    if (isPending) return;
    reset();
    onClose();
  }

  async function prefillMairieAddress(citycode: string) {
    const results = await searchAddresses("mairie", citycode, 3);
    const match = results.find((feature) =>
      /mairie|hôtel de ville|hotel de ville/i.test(feature.label),
    );
    if (match) {
      setMairieAddress(match.label);
    }
  }

  async function onPickCommune(feature: BanFeature) {
    setCommuneFeature(feature);
    setPostcode(feature.postcode ?? "");
    setMairieAddress("");
    setDuplicateCommuneId(null);
    setError(null);
    setLookupLoading(true);

    try {
      const params = new URLSearchParams({ inseeCode: feature.citycode });
      const res = await fetch(`/api/communes/lookup?${params}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as LookupResponse;

      if (json.commune) {
        setDuplicateCommuneId(json.commune.id);
        return;
      }

      await prefillMairieAddress(feature.citycode);
    } finally {
      setLookupLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!communeFeature || duplicateCommuneId) return;

    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createPilotCommuneAction(formData);
      if (!result.success) {
        if (result.existingCommuneId) {
          setDuplicateCommuneId(result.existingCommuneId);
        }
        setError(result.error);
        return;
      }

      reset();
      onClose();
      router.refresh();
      router.push(ROUTES.backoffice.communeDetail(result.communeId));
    });
  }

  const citycode = communeFeature?.citycode ?? "";
  const canSubmit =
    communeFeature &&
    !duplicateCommuneId &&
    mairieAddress.trim().length >= 3 &&
    !lookupLoading;

  return (
    <Modal open={open} onClose={handleClose} title="Ajouter une commune" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <BanAutocomplete
          label="Nom de la commune"
          placeholder="Ex : Les Authieux, Rouen…"
          fetchSuggestions={(q) => searchMunicipalities(q)}
          onSelect={(feature) => void onPickCommune(feature)}
          value={
            communeFeature ? formatMunicipalityDisplay(communeFeature) : undefined
          }
          formatSuggestion={formatMunicipalityDisplay}
          leadingIcon={MapPin}
          showChevron
        />

        {lookupLoading ? (
          <p className="text-xs font-medium text-muted">Vérification de la commune…</p>
        ) : null}

        {duplicateCommuneId ? (
          <p className="text-sm font-medium text-coral" role="alert">
            Cette commune existe déjà.{" "}
            <Link
              href={ROUTES.backoffice.communeDetail(duplicateCommuneId)}
              className="text-purple underline"
            >
              Voir la fiche
            </Link>
          </p>
        ) : null}

        <FormField label="Code postal">
          <Input
            name="postcode"
            value={postcode}
            onChange={(event) => setPostcode(event.target.value)}
            placeholder="76640"
            disabled={!communeFeature}
          />
        </FormField>

        <BanAutocomplete
          label="Adresse de la mairie"
          placeholder="Numéro, rue… ou « mairie »"
          fetchSuggestions={(q) => searchAddresses(q, citycode)}
          onSelect={(feature) => setMairieAddress(feature.label)}
          value={mairieAddress}
          disabled={!citycode || Boolean(duplicateCommuneId)}
        />

        <input type="hidden" name="mairieAddress" value={mairieAddress} />
        <input type="hidden" name="inseeCode" value={citycode} />
        <input type="hidden" name="name" value={communeFeature?.city ?? ""} />
        <input
          type="hidden"
          name="centroidLat"
          value={String(communeFeature?.lat ?? 0)}
        />
        <input
          type="hidden"
          name="centroidLng"
          value={String(communeFeature?.lng ?? 0)}
        />
        <input type="hidden" name="accessStatus" value={accessStatus} />

        <FormField label="Statut">
          <Select
            items={ALL_ACCESS_STATUSES.map((status) => ({
              value: status,
              label: ACCESS_STATUS_LABELS[status],
            }))}
            value={accessStatus}
            onValueChange={(value) => {
              if (!value) return;
              setAccessStatus(value as AccessStatus);
            }}
            disabled={Boolean(duplicateCommuneId)}
          >
            <SelectTrigger className="w-full rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_ACCESS_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {ACCESS_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {error && !duplicateCommuneId ? (
          <p className="text-sm font-medium text-coral" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="font-semibold"
            disabled={isPending}
            onClick={handleClose}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="font-semibold"
            disabled={isPending || !canSubmit}
          >
            {isPending ? "Création…" : "Créer la commune"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
