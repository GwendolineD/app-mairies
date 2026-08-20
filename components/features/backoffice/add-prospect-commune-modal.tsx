"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { BanAutocomplete } from "@/components/features/ban-autocomplete";
import {
  createProspectCommuneAction,
  lookupProspectCommuneByInsee,
} from "@/lib/actions/prospect-outreach";
import type { BanFeature } from "@/lib/ban/client";
import { searchAddresses, searchMunicipalities } from "@/lib/ban/client";
import { formatMunicipalityDisplay } from "@/lib/ban/display";
import {
  buildProspectCommunesQuery,
  parseProspectCommunesParams,
} from "@/lib/prospect-communes/filter-params";
import { fetchGeoCommunePreview } from "@/lib/prospect-communes/geo-commune";
import { PROSPECT_DEPARTEMENT_OPTIONS } from "@/lib/prospect-communes/types";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";

type Props = {
  open: boolean;
  onClose: () => void;
};

const PROSPECT_DEPT_SET = new Set<string>(PROSPECT_DEPARTEMENT_OPTIONS);

export function AddProspectCommuneModal({ open, onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listParams = useMemo(
    () =>
      parseProspectCommunesParams(
        Object.fromEntries(searchParams.entries()),
      ),
    [searchParams],
  );

  const [isPending, startTransition] = useTransition();
  const [communeFeature, setCommuneFeature] = useState<BanFeature | null>(null);
  const [postcode, setPostcode] = useState("");
  const [mairieAddress, setMairieAddress] = useState("");
  const [population, setPopulation] = useState("");
  const [populationFromGeo, setPopulationFromGeo] = useState(false);
  const [departement, setDepartement] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [duplicateProspectId, setDuplicateProspectId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const detailHref = useMemo(() => {
    if (!duplicateProspectId) return null;
    return `${pathname}${buildProspectCommunesQuery({
      ...listParams,
      detailId: duplicateProspectId,
    })}`;
  }, [duplicateProspectId, listParams, pathname]);

  const reset = useCallback(() => {
    setCommuneFeature(null);
    setPostcode("");
    setMairieAddress("");
    setPopulation("");
    setPopulationFromGeo(false);
    setDepartement(null);
    setLookupLoading(false);
    setDuplicateProspectId(null);
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
    setPopulation("");
    setPopulationFromGeo(false);
    setDepartement(null);
    setDuplicateProspectId(null);
    setError(null);
    setLookupLoading(true);

    try {
      const lookup = await lookupProspectCommuneByInsee(feature.citycode);
      if (lookup.existing) {
        setDuplicateProspectId(lookup.existing.id);
        return;
      }

      const geo = await fetchGeoCommunePreview(feature.citycode);
      if (geo) {
        setDepartement(geo.codeDepartement);
        if (typeof geo.population === "number" && Number.isFinite(geo.population)) {
          setPopulation(String(geo.population));
          setPopulationFromGeo(true);
        }
      }

      await prefillMairieAddress(feature.citycode);
    } finally {
      setLookupLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!communeFeature || duplicateProspectId) return;

    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createProspectCommuneAction(formData);
      if (!result.success) {
        if (result.existingProspectCommuneId) {
          setDuplicateProspectId(result.existingProspectCommuneId);
        }
        setError(result.error);
        return;
      }

      const nextHref = `${pathname}${buildProspectCommunesQuery({
        ...listParams,
        detailId: result.prospectCommuneId,
      })}`;

      reset();
      onClose();
      router.refresh();
      router.push(nextHref);
    });
  }

  const citycode = communeFeature?.citycode ?? "";
  const populationRequired = !populationFromGeo;
  const canSubmit =
    communeFeature &&
    !duplicateProspectId &&
    mairieAddress.trim().length >= 3 &&
    !lookupLoading &&
    (!populationRequired || population.trim().length > 0);

  const showDeptWarning =
    departement != null && !PROSPECT_DEPT_SET.has(departement);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Ajouter une commune de prospection"
      size="lg"
    >
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
          singleLine
          leadingIcon={MapPin}
          showChevron
        />

        {lookupLoading ? (
          <p className="text-xs font-medium text-muted">Vérification de la commune…</p>
        ) : null}

        {duplicateProspectId && detailHref ? (
          <p className="text-sm font-medium text-coral" role="alert">
            Cette commune existe déjà dans la prospection.{" "}
            <Link href={detailHref} className="text-purple underline">
              Voir la fiche
            </Link>
          </p>
        ) : null}

        {showDeptWarning ? (
          <p className="text-sm font-medium text-muted" role="status">
            Département {departement} — hors périmètre 27/28/78. La commune peut
            être masquée si un filtre département est actif.
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
          disabled={!citycode || Boolean(duplicateProspectId)}
          singleLine
        />

        <FormField label="Population">
          {populationFromGeo ? (
            <p className="text-xs font-medium text-muted">
              Récupérée depuis geo.api.gouv.fr
            </p>
          ) : (
            <p className="text-xs font-medium text-muted">
              Obligatoire si non disponible via geo.api.gouv.fr
            </p>
          )}
          <Input
            name="populationFallback"
            value={population}
            onChange={(event) => setPopulation(event.target.value)}
            placeholder="Ex : 1200"
            disabled={!communeFeature || populationFromGeo || Boolean(duplicateProspectId)}
            readOnly={populationFromGeo}
          />
        </FormField>

        <input type="hidden" name="inseeCode" value={citycode} />
        <input type="hidden" name="adresse_mairie" value={mairieAddress} />

        {error && !duplicateProspectId ? (
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
            {isPending ? "Création…" : "Ajouter la commune"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
