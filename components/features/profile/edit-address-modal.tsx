"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { updateAddress } from "@/lib/actions/profile";
import { searchAddresses, type BanFeature } from "@/lib/ban/client";
import { formatStreetDisplay } from "@/lib/ban/display";
import { addressUpdateSchema } from "@/lib/validations/schemas";
import { BanAutocomplete } from "@/components/features/ban-autocomplete";
import {
  buildInitialAddress,
  hasValidCoords,
  resolveCoordsFromBan,
  type ProfileAddressState,
} from "@/components/features/profile/profile-address-helpers";
import { InlineEditModal } from "@/components/features/profile/inline-edit-modal";
import { FormField, Input } from "@/components/ui/form-field";

type Props = {
  open: boolean;
  onClose: () => void;
  communeName: string;
  addressStreet: string | null;
  addressPostcode: string | null;
  addressCity: string | null;
  addressCitycode: string | null;
  addressLat: number | null;
  addressLng: number | null;
};

export function EditAddressModal({
  open,
  onClose,
  communeName,
  addressStreet,
  addressPostcode,
  addressCity,
  addressCitycode,
  addressLat,
  addressLng,
}: Props) {
  const router = useRouter();
  const [addr, setAddr] = useState<ProfileAddressState>(() =>
    buildInitialAddress(
      addressStreet,
      addressPostcode,
      addressCity,
      addressLat,
      addressLng,
    ),
  );
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const citycode = addressCitycode ?? "";
  const initialAddr = useMemo(
    () =>
      buildInitialAddress(
        addressStreet,
        addressPostcode,
        addressCity,
        addressLat,
        addressLng,
      ),
    [
      addressStreet,
      addressPostcode,
      addressCity,
      addressLat,
      addressLng,
    ],
  );

  useEffect(() => {
    if (!open) return;
    setAddr(initialAddr);
    setAddressConfirmed(hasValidCoords(initialAddr.lat, initialAddr.lng));
    setAddressError(null);
  }, [open, initialAddr]);

  const fetchStreetSuggestions = useCallback(
    (query: string) => {
      if (!citycode) return Promise.resolve([]);
      return searchAddresses(query, citycode);
    },
    [citycode],
  );

  const invalidateAddressCoords = useCallback(
    (patch: Partial<Pick<ProfileAddressState, "street" | "city" | "postcode">>) => {
      setAddr((prev) => ({
        ...prev,
        ...patch,
        lat: 0,
        lng: 0,
      }));
      setAddressConfirmed(false);
      setAddressError(null);
    },
    [],
  );

  const handlePickStreet = useCallback((feature: BanFeature) => {
    setAddr((prev) => ({
      ...prev,
      street: formatStreetDisplay(feature.label),
      city: feature.city?.trim() || prev.city,
      postcode: feature.postcode?.trim() || prev.postcode,
      lat: feature.lat,
      lng: feature.lng,
    }));
    setAddressConfirmed(true);
    setAddressError(null);
  }, []);

  const hasChanges = useMemo(() => {
    return (
      addr.street.trim() !== initialAddr.street.trim() ||
      addr.city.trim() !== initialAddr.city.trim() ||
      addr.postcode.trim() !== initialAddr.postcode.trim()
    );
  }, [addr, initialAddr]);

  const canSubmit = useMemo(() => {
    if (!hasChanges) return false;
    if (!addressConfirmed && !hasValidCoords(addr.lat, addr.lng)) {
      return (
        addr.street.trim().length > 0 &&
        addr.city.trim().length > 0 &&
        addr.postcode.trim().length >= 4
      );
    }
    const parsed = addressUpdateSchema.safeParse({
      addressStreet: addr.street,
      addressCity: addr.city,
      addressPostcode: addr.postcode,
      addressLat: addr.lat,
      addressLng: addr.lng,
    });
    return parsed.success;
  }, [addr, addressConfirmed, hasChanges]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAddressError(null);

    startTransition(async () => {
      let lat = addr.lat;
      let lng = addr.lng;

      if (!addressConfirmed || !hasValidCoords(lat, lng)) {
        const resolved = await resolveCoordsFromBan(
          addr.street,
          addr.postcode,
          addr.city,
          citycode,
        );
        if (!resolved) {
          setAddressError(
            "Sélectionnez une adresse dans la liste pour valider la localisation.",
          );
          return;
        }
        lat = resolved.lat;
        lng = resolved.lng;
      }

      const parsed = addressUpdateSchema.safeParse({
        addressStreet: addr.street,
        addressCity: addr.city,
        addressPostcode: addr.postcode,
        addressLat: lat,
        addressLng: lng,
      });
      if (!parsed.success) {
        setAddressError(parsed.error.issues[0]?.message ?? "Adresse invalide");
        return;
      }

      const result = await updateAddress({
        addressStreet: parsed.data.addressStreet,
        addressCity: parsed.data.addressCity,
        addressPostcode: parsed.data.addressPostcode,
        addressLat: parsed.data.addressLat,
        addressLng: parsed.data.addressLng,
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Adresse mise à jour !");
      router.refresh();
      onClose();
    });
  }

  return (
    <InlineEditModal
      open={open}
      onClose={onClose}
      title="Modifier mon adresse"
      formId="edit-address-form"
      isSubmitting={isPending}
      canSubmit={canSubmit}
    >
      <form id="edit-address-form" onSubmit={handleSubmit} className="space-y-4">
        {communeName ? (
          <p className="text-sm font-semibold text-text">{communeName}</p>
        ) : null}

        <FormField label="Rue">
          <BanAutocomplete
            label="Rue"
            hideLabel
            placeholder="Numéro, rue..."
            fetchSuggestions={fetchStreetSuggestions}
            formatSuggestion={(feature) => formatStreetDisplay(feature.label)}
            onSelect={handlePickStreet}
            onInputChange={(text) => invalidateAddressCoords({ street: text })}
            value={addr.street}
            disabled={!citycode}
            leadingIcon={MapPin}
          />
          {addressError ? (
            <p className="mt-1.5 text-xs font-medium text-coral" role="alert">
              {addressError}
            </p>
          ) : null}
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Code postal">
            <Input
              required
              autoComplete="postal-code"
              inputMode="numeric"
              value={addr.postcode}
              onChange={(e) =>
                invalidateAddressCoords({ postcode: e.target.value })
              }
              placeholder="27000"
              disabled={!citycode}
            />
          </FormField>
          <FormField label="Ville">
            <Input
              required
              autoComplete="address-level2"
              value={addr.city}
              onChange={(e) => invalidateAddressCoords({ city: e.target.value })}
              placeholder="Ville"
              disabled={!citycode}
            />
          </FormField>
        </div>
      </form>
    </InlineEditModal>
  );
}
