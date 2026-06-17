"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, MapPin, Sparkles } from "lucide-react";
import { createInitiative, updateInitiative } from "@/lib/actions/initiatives";
import { searchAddresses, type BanFeature } from "@/lib/ban/client";
import { formatStreetDisplay } from "@/lib/ban/display";
import {
  INITIATIVE_CATEGORIES,
  getInitiativeCategoryBySlug,
  type InitiativeEventCategory,
} from "@/lib/constants/initiative-categories";
import { ROUTES } from "@/lib/constants/routes";
import {
  CloudinaryUploadError,
  uploadImageToCloudinary,
} from "@/lib/services/cloudinary-client";
import {
  clearFormDraft,
  readFormDraft,
  writeFormDraft,
} from "@/lib/utils/form-draft";
import { Button } from "@/components/ui/button";
import { FormField, formFieldClassName, Input, Textarea } from "@/components/ui/form-field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { GradientButton } from "@/components/ui/gradient-button";
import { Modal } from "@/components/ui/modal";
import { ImageDropzone } from "@/components/features/image-dropzone";
import { BanAutocomplete } from "@/components/features/ban-autocomplete";
import { cn } from "@/lib/utils/cn";
import type { InitiativeEditData, MembershipAddress } from "@/lib/types";

const TITLE_MAX = 70;
const DESCRIPTION_MAX = 1000;

const INITIATIVE_TIPS = [
  "Expliquez votre idée en quelques phrases.",
  "Dites pourquoi elle serait utile à la commune.",
  "Soyez ouvert aux suggestions.",
  "Plus votre idée est claire, plus elle pourra rassembler.",
  "Quand elle sera prête, vous pourrez la transformer en événement 🤩.",
] as const;

type SubmitPhase = "idle" | "uploading" | "publishing";

type AddressFormState = {
  street: string;
  city: string;
  citycode: string;
  postcode: string;
  lat: number | null;
  lng: number | null;
};

type Draft = {
  categorySlug: string;
  title: string;
  description: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  communeId: string;
  membershipAddress: MembershipAddress;
  editId?: string;
  initialData?: InitiativeEditData;
};

function getInitialAddressFromEditData(
  initialData: InitiativeEditData,
): { addressData: AddressFormState; addressConfirmed: boolean } {
  return {
    addressData: {
      street: initialData.addressStreet,
      city: initialData.addressCity,
      citycode: initialData.addressCitycode,
      postcode: initialData.addressPostcode,
      lat: initialData.addressLat,
      lng: initialData.addressLng,
    },
    addressConfirmed: true,
  };
}

function getInitialAddressState(
  membershipAddress: MembershipAddress,
): { addressData: AddressFormState; addressConfirmed: boolean } {
  const street = membershipAddress.street?.trim() ?? "";
  const city = membershipAddress.city?.trim() ?? "";
  const citycode = membershipAddress.citycode?.trim() ?? "";
  const postcode = membershipAddress.postcode?.trim() ?? "";
  const lat = membershipAddress.lat;
  const lng = membershipAddress.lng;
  const addressConfirmed =
    street.length > 0 &&
    city.length > 0 &&
    citycode.length > 0 &&
    postcode.length >= 4 &&
    lat != null &&
    lng != null;

  return {
    addressData: { street, city, citycode, postcode, lat, lng },
    addressConfirmed,
  };
}

function SectionHeading({
  number,
  title,
}: {
  number: number;
  title: string;
}) {
  return (
    <h3 className="text-base font-bold text-text">
      {number}. {title}
    </h3>
  );
}

export function CreateInitiativeModal({
  open,
  onClose,
  communeId,
  membershipAddress,
  editId,
  initialData,
}: Props) {
  const router = useRouter();
  const isEditMode = Boolean(editId);
  const draftKey = isEditMode ? null : `initiative:${communeId}`;
  const initialAddress = useMemo(
    () =>
      initialData
        ? getInitialAddressFromEditData(initialData)
        : getInitialAddressState(membershipAddress),
    [membershipAddress, initialData],
  );

  const [categorySlug, setCategorySlug] = useState<string>(
    initialData?.categorySlug ?? INITIATIVE_CATEGORIES[0]?.slug ?? "solidarite",
  );
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [addressData, setAddressData] = useState<AddressFormState>(
    initialAddress.addressData,
  );
  const [addressConfirmed, setAddressConfirmed] = useState(
    initialAddress.addressConfirmed,
  );
  const [addressStreetError, setAddressStreetError] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  const fetchStreetSuggestions = useCallback(
    (query: string) => searchAddresses(query),
    [],
  );

  const resetForm = useCallback(() => {
    if (initialData) {
      setCategorySlug(initialData.categorySlug);
      setTitle(initialData.title);
      setDescription(initialData.description);
      setPendingFile(null);
      const address = getInitialAddressFromEditData(initialData);
      setAddressData(address.addressData);
      setAddressConfirmed(address.addressConfirmed);
    } else {
      const address = getInitialAddressState(membershipAddress);
      setCategorySlug(INITIATIVE_CATEGORIES[0]?.slug ?? "solidarite");
      setTitle("");
      setDescription("");
      setPendingFile(null);
      setAddressData(address.addressData);
      setAddressConfirmed(address.addressConfirmed);
    }
    setAddressStreetError(null);
    setFormError(null);
    setSubmitting(false);
    setSubmitPhase("idle");
  }, [membershipAddress, initialData]);

  useEffect(() => {
    if (!open) return;
    if (draftKey) {
      const saved = readFormDraft<Draft>(draftKey);
      resetForm();
      if (saved) {
        setCategorySlug(saved.categorySlug);
        setTitle(saved.title);
        setDescription(saved.description);
      }
    } else {
      resetForm();
    }
  }, [open, draftKey, resetForm]);

  useEffect(() => {
    if (!open || !draftKey) return;
    writeFormDraft(draftKey, {
      categorySlug,
      title,
      description,
    });
  }, [open, draftKey, categorySlug, title, description]);

  const handleAbandon = useCallback(() => {
    if (submitting) return;
    resetForm();
    if (draftKey) clearFormDraft(draftKey);
    onClose();
  }, [submitting, resetForm, draftKey, onClose]);

  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    addressConfirmed &&
    addressData.street.trim().length > 0 &&
    addressData.city.trim().length > 0 &&
    addressData.citycode.trim().length > 0 &&
    addressData.postcode.trim().length >= 4 &&
    addressData.lat != null &&
    addressData.lng != null;

  function invalidateAddressCoords(
    patch: Partial<Pick<AddressFormState, "street" | "city" | "postcode">>,
  ) {
    setAddressData((prev) => ({
      ...prev,
      ...patch,
      lat: null,
      lng: null,
    }));
    setAddressConfirmed(false);
    setAddressStreetError(null);
  }

  function handleStreetInputChange(text: string) {
    invalidateAddressCoords({ street: text });
  }

  function handleCityChange(city: string) {
    invalidateAddressCoords({ city });
  }

  function handlePostcodeChange(postcode: string) {
    invalidateAddressCoords({ postcode });
  }

  function handlePickStreet(feature: BanFeature) {
    setAddressData((prev) => ({
      ...prev,
      street: formatStreetDisplay(feature.label),
      city: feature.city?.trim() || prev.city,
      citycode: feature.citycode?.trim() || prev.citycode,
      postcode: feature.postcode?.trim() || prev.postcode,
      lat: feature.lat,
      lng: feature.lng,
    }));
    setAddressConfirmed(true);
    setAddressStreetError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setAddressStreetError(null);

    if (!addressConfirmed || addressData.lat == null || addressData.lng == null) {
      setAddressStreetError(
        "Sélectionnez une adresse dans la liste pour valider la localisation.",
      );
      return;
    }

    setSubmitting(true);

    try {
      let photoUrl = "";

      if (pendingFile) {
        setSubmitPhase("uploading");
        photoUrl = await uploadImageToCloudinary(pendingFile, "initiative");
      }

      setSubmitPhase("publishing");
      const fd = new FormData();
      fd.set("categorySlug", categorySlug);
      fd.set("title", title);
      fd.set("description", description.trim());
      fd.set("addressStreet", addressData.street.trim());
      fd.set("addressCity", addressData.city.trim());
      fd.set("addressCitycode", addressData.citycode.trim());
      fd.set("addressPostcode", addressData.postcode.trim());
      fd.set("addressLat", String(addressData.lat));
      fd.set("addressLng", String(addressData.lng));
      fd.set("photoUrl", photoUrl || (initialData?.photoUrl ?? ""));

      if (editId) {
        const result = await updateInitiative(editId, fd);
        if ("error" in result) {
          setFormError(result.error);
          setSubmitting(false);
          setSubmitPhase("idle");
          return;
        }
        if (draftKey) clearFormDraft(draftKey);
        setSubmitting(false);
        setSubmitPhase("idle");
        onClose();
        router.refresh();
        return;
      }

      const { id } = await createInitiative(fd);
      if (draftKey) clearFormDraft(draftKey);
      setSubmitting(false);
      setSubmitPhase("idle");
      onClose();
      router.push(ROUTES.initiatives.detail(id));
    } catch (error) {
      if (error instanceof CloudinaryUploadError) {
        if (error.errorType === "virus_detected") {
          setFormError("Ce fichier a été rejeté pour des raisons de sécurité.");
        } else if (error.errorType === "service_unavailable") {
          setFormError("Service de sécurité indisponible. Réessayez plus tard.");
        } else {
          setFormError(error.message);
        }
      } else if (error instanceof Error && error.message) {
        setFormError(error.message);
      } else {
        setFormError("Une erreur est survenue lors de la publication.");
      }
      setSubmitting(false);
      setSubmitPhase("idle");
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleAbandon}
      closeDisabled={submitting}
      title={isEditMode ? "Modifier votre initiative" : "Lancer une initiative"}
      size="xl"
      showCloseButton
      className="sm:max-w-3xl"
    >
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex flex-col gap-8 pb-2",
          submitting && "pointer-events-none opacity-70",
        )}
      >
        <div className="rounded-xl border border-mint/30 bg-mint/5 px-4 py-3">
          <p className="text-sm font-bold text-text">
            Conseils pour une initiative réussie{" "}
            <Sparkles className="inline size-4 text-mint" aria-hidden />
          </p>
          <ul className="mt-2 space-y-1.5">
            {INITIATIVE_TIPS.map((tip) => (
              <li
                key={tip}
                className="flex items-start gap-2 text-sm font-medium text-muted"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-mint" aria-hidden />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <section className="space-y-3">
          <SectionHeading number={1} title="Choisissez une catégorie" />
          <CategorySelectMobile
            value={categorySlug}
            onChange={setCategorySlug}
          />
          <div className="hidden grid-cols-3 gap-2 sm:grid sm:grid-cols-4">
            {INITIATIVE_CATEGORIES.map((cat) => {
              const selected = categorySlug === cat.slug;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setCategorySlug(cat.slug)}
                  className={cn(
                    "relative flex cursor-pointer flex-row items-center gap-2 rounded-md border-2 px-2.5 py-1.5 text-left transition",
                    selected
                      ? "border-purple bg-soft-pink shadow-sm"
                      : "border-border bg-surface hover:border-purple/25",
                  )}
                  style={
                    selected
                      ? {
                          borderColor: cat.colorHex,
                          backgroundColor: `${cat.colorHex}12`,
                        }
                      : undefined
                  }
                >
                  {selected ? (
                    <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-purple text-white">
                      <Check className="size-2.5" strokeWidth={3} aria-hidden />
                    </span>
                  ) : null}
                  <CategoryIconBadge category={cat} />
                  <span className="min-w-0 flex-1 text-xs leading-tight font-semibold text-text">
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading number={2} title="Décrivez votre initiative" />
          <FormField label="Titre de votre initiative *">
            <div className="relative">
              <Input
                name="title"
                required
                maxLength={TITLE_MAX}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex : Créer un jardin partagé au centre-ville"
                className="pr-14"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-subtle">
                {title.length}/{TITLE_MAX}
              </span>
            </div>
          </FormField>
          <FormField label="Description détaillée *">
            <div className="relative">
              <Textarea
                name="description"
                required
                rows={7}
                maxLength={DESCRIPTION_MAX}
                value={description}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next.length <= DESCRIPTION_MAX) {
                    setDescription(next);
                  }
                }}
                placeholder="Décrivez votre idée, son objectif, comment les habitants peuvent y participer…"
                className="max-h-96 overflow-y-auto pb-8 field-sizing-fixed resize-none"
              />
              <span className="pointer-events-none absolute right-3 bottom-2 text-xs font-medium text-subtle">
                {description.length}/{DESCRIPTION_MAX}
              </span>
            </div>
          </FormField>
        </section>

        <section className="space-y-4">
          <SectionHeading number={3} title="Où se situe l'initiative ?" />
          <FormField label="Rue *">
            <BanAutocomplete
              label="Rue"
              hideLabel
              placeholder="Numéro, rue..."
              fetchSuggestions={fetchStreetSuggestions}
              onSelect={handlePickStreet}
              onInputChange={handleStreetInputChange}
              value={addressData.street || undefined}
              formatSuggestion={(feature) => formatStreetDisplay(feature.label)}
              leadingIcon={MapPin}
            />
            {addressStreetError ? (
              <p className="mt-1.5 text-xs font-medium text-coral" role="alert">
                {addressStreetError}
              </p>
            ) : (
              <p className="mt-1.5 text-xs font-medium text-subtle">
                Lieu de l&apos;initiative / lieu du départ, si l&apos;initiative amène
                à se déplacer / votre adresse si lieu est encore inconnu
              </p>
            )}
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Code postal *">
              <Input
                name="addressPostcode"
                required
                autoComplete="postal-code"
                inputMode="numeric"
                value={addressData.postcode}
                onChange={(e) => handlePostcodeChange(e.target.value)}
                placeholder="27000"
              />
            </FormField>
            <FormField label="Ville *">
              <Input
                name="addressCity"
                required
                autoComplete="address-level2"
                value={addressData.city}
                onChange={(e) => handleCityChange(e.target.value)}
                placeholder="Ville"
              />
            </FormField>
          </div>
        </section>

        <section className="space-y-4">
          <ImageDropzone
            file={pendingFile}
            onFileChange={setPendingFile}
            isUploading={submitPhase === "uploading"}
          />
        </section>

        {formError ? (
          <p className="text-sm font-medium text-coral" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="pointer-events-auto flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={handleAbandon}
            disabled={submitting}
            className="sm:min-w-[120px]"
          >
            Annuler
          </Button>
          <GradientButton
            type="submit"
            gradient="initiative"
            className="sm:min-w-[200px]"
            disabled={submitting || !canSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {submitPhase === "uploading"
                  ? "Envoi de la photo…"
                  : isEditMode
                    ? "Enregistrement…"
                    : "Publication…"}
              </>
            ) : isEditMode ? (
              "Enregistrer les modifications"
            ) : (
              "Publier mon initiative"
            )}
          </GradientButton>
        </div>
      </form>
    </Modal>
  );
}

function CategoryIconBadge({
  category,
  className,
  iconClassName,
}: {
  category: InitiativeEventCategory;
  className?: string;
  iconClassName?: string;
}) {
  const Icon = category.Icon;
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md",
        className,
      )}
      style={{
        backgroundColor: `${category.colorHex}22`,
        color: category.colorHex,
      }}
    >
      <Icon className={cn("size-3.5", iconClassName)} strokeWidth={2} aria-hidden />
    </span>
  );
}

function CategorySelectMobile({
  value,
  onChange,
}: {
  value: string;
  onChange: (slug: string) => void;
}) {
  const selected = getInitiativeCategoryBySlug(value);

  return (
    <div className="sm:hidden">
      <Select value={value} onValueChange={(next) => next && onChange(next)}>
        <SelectTrigger
          aria-label="Catégorie"
          className={cn(
            formFieldClassName,
            "w-full justify-between data-[size=default]:h-auto",
          )}
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-2">
              <CategoryIconBadge category={selected} />
              <span className="truncate font-medium text-text">
                {selected.label}
              </span>
            </span>
          ) : (
            <span className="text-subtle">Choisir une catégorie</span>
          )}
        </SelectTrigger>
        <SelectContent align="start" className="max-h-64">
          <SelectGroup>
            {INITIATIVE_CATEGORIES.map((cat) => (
              <SelectItem
                key={cat.slug}
                value={cat.slug}
                className="min-h-12 gap-2.5 py-3"
              >
                <CategoryIconBadge category={cat} />
                {cat.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
