"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { BanAutocomplete } from "@/components/features/ban-autocomplete";
import { updateCommuneInfo } from "@/lib/actions/platform";
import { searchAddresses } from "@/lib/ban/client";
import { formatStreetDisplay } from "@/lib/ban/display";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";

type Props = {
  open: boolean;
  onClose: () => void;
  communeId: string;
  inseeCode: string;
  initialName: string;
  initialPostcode: string;
  initialPopulation: number | null;
  initialMairieAddressStreet: string;
  initialMairieAddressCity: string;
  initialMairieAddressPostcode: string;
  initialMairieAddressLat: number | null;
  initialMairieAddressLng: number | null;
};

export function EditCommuneInfoModal({
  open,
  onClose,
  communeId,
  inseeCode,
  initialName,
  initialPostcode,
  initialPopulation,
  initialMairieAddressStreet,
  initialMairieAddressCity,
  initialMairieAddressPostcode,
  initialMairieAddressLat,
  initialMairieAddressLng,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [postcode, setPostcode] = useState(initialPostcode);
  const [population, setPopulation] = useState(
    initialPopulation != null ? String(initialPopulation) : "",
  );
  const [mairieAddressLabel, setMairieAddressLabel] = useState(
    initialMairieAddressStreet,
  );
  const [mairieAddressStreet, setMairieAddressStreet] = useState(
    initialMairieAddressStreet,
  );
  const [mairieAddressCity, setMairieAddressCity] = useState(
    initialMairieAddressCity,
  );
  const [mairieAddressPostcode, setMairieAddressPostcode] = useState(
    initialMairieAddressPostcode,
  );
  const [mairieAddressLat, setMairieAddressLat] = useState<number | null>(
    initialMairieAddressLat,
  );
  const [mairieAddressLng, setMairieAddressLng] = useState<number | null>(
    initialMairieAddressLng,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setPostcode(initialPostcode);
    setPopulation(initialPopulation != null ? String(initialPopulation) : "");
    setMairieAddressLabel(initialMairieAddressStreet);
    setMairieAddressStreet(initialMairieAddressStreet);
    setMairieAddressCity(initialMairieAddressCity);
    setMairieAddressPostcode(initialMairieAddressPostcode);
    setMairieAddressLat(initialMairieAddressLat);
    setMairieAddressLng(initialMairieAddressLng);
    setError(null);
  }, [
    open,
    initialName,
    initialPostcode,
    initialPopulation,
    initialMairieAddressStreet,
    initialMairieAddressCity,
    initialMairieAddressPostcode,
    initialMairieAddressLat,
    initialMairieAddressLng,
  ]);

  function handleClose() {
    if (isPending) return;
    onClose();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedPopulation =
      population.trim().length > 0 ? Number.parseInt(population, 10) : null;
    if (
      population.trim().length > 0 &&
      (parsedPopulation == null || Number.isNaN(parsedPopulation) || parsedPopulation < 1)
    ) {
      setError("Le nombre d'habitants doit être un entier positif.");
      return;
    }

    startTransition(async () => {
      const result = await updateCommuneInfo(communeId, {
        name,
        postcode,
        mairieAddressStreet,
        mairieAddressCity: mairieAddressCity || name,
        mairieAddressPostcode: mairieAddressPostcode || postcode,
        mairieAddressLat: mairieAddressLat ?? undefined,
        mairieAddressLng: mairieAddressLng ?? undefined,
        population: parsedPopulation,
      });

      if (!result.success) {
        setError(result.error ?? "Enregistrement impossible.");
        return;
      }

      onClose();
      router.refresh();
    });
  }

  const canSubmit =
    name.trim().length >= 1 &&
    postcode.trim().length >= 4 &&
    mairieAddressStreet.trim().length >= 3;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Modifier la commune"
      size="lg"
      closeDisabled={isPending}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nom de la commune">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </FormField>

        <FormField label="Code postal">
          <Input
            value={postcode}
            onChange={(event) => setPostcode(event.target.value)}
            required
          />
        </FormField>

        <BanAutocomplete
          label="Adresse de la mairie"
          placeholder="Numéro, rue…"
          fetchSuggestions={(q) => searchAddresses(q, inseeCode)}
          onSelect={(feature) => {
            setMairieAddressLabel(feature.label);
            setMairieAddressStreet(formatStreetDisplay(feature.label));
            setMairieAddressCity(feature.city?.trim() || name);
            setMairieAddressPostcode(feature.postcode?.trim() || postcode);
            setMairieAddressLat(feature.lat);
            setMairieAddressLng(feature.lng);
          }}
          value={mairieAddressLabel}
        />

        <FormField label="Nombre d'habitants">
          <Input
            type="number"
            min={1}
            inputMode="numeric"
            value={population}
            onChange={(event) => setPopulation(event.target.value)}
            placeholder="Ex. 850"
          />
        </FormField>

        {error ? (
          <p className="text-sm font-medium text-coral" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={handleClose}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isPending || !canSubmit}
          >
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
