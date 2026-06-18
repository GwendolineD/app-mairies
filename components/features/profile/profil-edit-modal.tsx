"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "@/lib/actions/profile";
import {
  CloudinaryUploadError,
  uploadImageToCloudinary,
} from "@/lib/services/cloudinary-client";
import { searchAddresses, type BanFeature } from "@/lib/ban/client";
import { formatStreetDisplay } from "@/lib/ban/display";
import { BanAutocomplete } from "@/components/features/ban-autocomplete";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";

type AddressState = {
  street: string;
  city: string;
  postcode: string;
  lat: number;
  lng: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  avatarUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  communeName: string;
  addressStreet: string | null;
  addressPostcode: string | null;
  addressCity: string | null;
  addressCitycode: string | null;
  addressLat: number | null;
  addressLng: number | null;
};

function slugifyName(first: string | null, last: string | null) {
  return [first, last]
    .filter(Boolean)
    .join("-")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 60);
}

function hasValidCoords(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
}

function buildInitialAddress(
  addressStreet: string | null,
  addressPostcode: string | null,
  addressCity: string | null,
  addressLat: number | null,
  addressLng: number | null,
): AddressState {
  return {
    street: addressStreet ?? "",
    city: addressCity ?? "",
    postcode: addressPostcode ?? "",
    lat: addressLat ?? 0,
    lng: addressLng ?? 0,
  };
}

async function resolveCoordsFromBan(
  street: string,
  postcode: string,
  city: string,
  citycode: string,
): Promise<{ lat: number; lng: number } | null> {
  const query = [street, postcode, city].filter(Boolean).join(" ").trim();
  if (query.length < 3) return null;

  const results = await searchAddresses(query, citycode, 5);
  if (!results.length) return null;

  const normalizedStreet = street.trim().toLowerCase();
  const match =
    results.find((feature) =>
      formatStreetDisplay(feature.label).toLowerCase().includes(normalizedStreet),
    ) ?? results[0];

  return { lat: match.lat, lng: match.lng };
}

export function ProfilEditModal({
  open,
  onClose,
  avatarUrl,
  firstName,
  lastName,
  communeName,
  addressStreet,
  addressPostcode,
  addressCity,
  addressCitycode,
  addressLat,
  addressLng,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [first, setFirst] = useState(firstName ?? "");
  const [last, setLast] = useState(lastName ?? "");
  const [addr, setAddr] = useState<AddressState>(() =>
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
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const citycode = addressCitycode ?? "";

  useEffect(() => {
    if (!open) return;
    const initialAddr = buildInitialAddress(
      addressStreet,
      addressPostcode,
      addressCity,
      addressLat,
      addressLng,
    );
    setFirst(firstName ?? "");
    setLast(lastName ?? "");
    setAddr(initialAddr);
    setAddressConfirmed(hasValidCoords(initialAddr.lat, initialAddr.lng));
    setAddressError(null);
    setPreview(avatarUrl);
    setPendingAvatarUrl(null);
  }, [
    open,
    firstName,
    lastName,
    addressStreet,
    addressPostcode,
    addressCity,
    addressLat,
    addressLng,
    avatarUrl,
  ]);

  const fetchStreetSuggestions = useCallback(
    (query: string) => {
      if (!citycode) return Promise.resolve([]);
      return searchAddresses(query, citycode);
    },
    [citycode],
  );

  const invalidateAddressCoords = useCallback(
    (patch: Partial<Pick<AddressState, "street" | "city" | "postcode">>) => {
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

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setPreview(URL.createObjectURL(file));
      setUploading(true);
      try {
        const publicId = slugifyName(first, last) || undefined;
        const url = await uploadImageToCloudinary(file, "avatar", publicId);
        setPendingAvatarUrl(url);
        setPreview(url);
      } catch (err) {
        const msg =
          err instanceof CloudinaryUploadError
            ? err.message
            : "Erreur lors de l'upload de la photo.";
        toast.error(msg);
        setPreview(avatarUrl);
        setPendingAvatarUrl(null);
      } finally {
        setUploading(false);
      }
    },
    [avatarUrl, first, last],
  );

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

      const result = await updateProfile({
        firstName: first,
        lastName: last,
        avatarUrl: pendingAvatarUrl ?? avatarUrl ?? "",
        addressStreet: addr.street,
        addressCity: addr.city,
        addressPostcode: addr.postcode,
        addressLat: lat,
        addressLng: lng,
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Profil mis à jour !");
      router.refresh();
      onClose();
    });
  }

  const initials = [first, last]
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Éditer mon profil"
      showCloseButton
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            form="profil-edit-form"
            size="sm"
            disabled={isPending || uploading}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Enregistrer
          </Button>
        </div>
      }
    >
      <form
        id="profil-edit-form"
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-border bg-soft-pink text-2xl font-bold text-purple shadow-card transition hover:border-purple/40"
          >
            {preview ? (
              <Image
                src={preview}
                alt=""
                width={96}
                height={96}
                unoptimized
                className="size-full object-cover"
              />
            ) : (
              initials || "?"
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-text/40 opacity-0 transition group-hover:opacity-100">
              {uploading ? (
                <Loader2 className="size-5 animate-spin text-white" />
              ) : (
                <Camera className="size-5 text-white" />
              )}
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="text-xs text-muted">
            Cliquez pour changer votre photo (JPG/PNG, 5 Mo max)
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Prénom">
            <Input
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              required
              minLength={1}
            />
          </FormField>
          <FormField label="Nom">
            <Input
              value={last}
              onChange={(e) => setLast(e.target.value)}
              required
              minLength={1}
            />
          </FormField>
        </div>

        <div className="space-y-4">
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
        </div>
      </form>
    </Modal>
  );
}
