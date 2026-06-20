"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, MapPin } from "lucide-react";
import { createAnnouncement, updateAnnouncement } from "@/lib/actions/announcements";
import { searchAddresses, type BanFeature } from "@/lib/ban/client";
import { formatStreetDisplay } from "@/lib/ban/display";
import {
  ANNOUNCEMENT_CATEGORIES,
  getCategoryBySlug,
  type AnnouncementCategory,
  type AnnouncementCategorySlug,
} from "@/lib/constants/announcement-categories";
import type {
  AnnouncementType,
  AnnouncementTypeGradient,
} from "@/lib/constants/announcement-types";
import { getAnnouncementTypeConfig } from "@/lib/constants/announcement-types";
import { ROUTES } from "@/lib/constants/routes";
import {
  CloudinaryUploadError,
  uploadImageToCloudinary,
} from "@/lib/services/cloudinary-client";
import { clearFormDraft } from "@/lib/utils/form-draft";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { FormField, formFieldClassName, Input, Textarea } from "@/components/ui/form-field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { GradientButton } from "@/components/ui/gradient-button";
import { AnnouncementTypeIcon } from "@/components/ui/announcement-type-icon";
import { Modal } from "@/components/ui/modal";
import { ImageDropzone } from "@/components/features/image-dropzone";
import { BanAutocomplete } from "@/components/features/ban-autocomplete";
import { cn } from "@/lib/utils/cn";
import type { AnnouncementEditData, MembershipAddress } from "@/lib/types";

const TITLE_MAX = 70;
const DESCRIPTION_MAX = 1000;

const ANNOUNCEMENT_TIPS = [
  "Donnez un titre clair et précis.",
  "Expliquez simplement votre besoin ou ce que vous proposez.",
  "Indiquez quand vous êtes disponible.",
  "Remerciez les personnes qui prendront le temps de vous répondre ❤️",
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

type Props = {
  open: boolean;
  onClose: () => void;
  communeId: string;
  membershipAddress: MembershipAddress;
  presetType?: AnnouncementType;
  editId?: string;
  initialData?: AnnouncementEditData;
};

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

function getInitialFormState(presetType: AnnouncementType) {
  return {
    type: presetType,
    categorySlug: ANNOUNCEMENT_CATEGORIES[0].slug,
    title: "",
    description: "",
    targetDate: "",
    pendingFile: null as File | null,
  };
}

export function CreateAnnouncementModal({
  open,
  onClose,
  communeId,
  membershipAddress,
  presetType = "demande",
  editId,
  initialData,
}: Props) {
  const router = useRouter();
  const isEditMode = Boolean(editId);
  const draftKey = isEditMode ? null : `announcement:${communeId}`;
  const initialAddress = useMemo(
    () =>
      initialData
        ? {
            addressData: {
              street: initialData.addressStreet,
              city: initialData.addressCity,
              citycode: initialData.addressCitycode,
              postcode: initialData.addressPostcode,
              lat: initialData.addressLat as number | null,
              lng: initialData.addressLng as number | null,
            },
            addressConfirmed: true,
          }
        : getInitialAddressState(membershipAddress),
    [membershipAddress, initialData],
  );
  const [type, setType] = useState<AnnouncementType>(initialData?.type ?? presetType);
  const [categorySlug, setCategorySlug] = useState<AnnouncementCategorySlug>(
    (initialData?.categorySlug as AnnouncementCategorySlug) ?? ANNOUNCEMENT_CATEGORIES[0].slug,
  );
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(
    () => (initialData?.description ?? "").slice(0, DESCRIPTION_MAX),
  );
  const [targetDate, setTargetDate] = useState(initialData?.targetDate ?? "");
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

  const citycode =
    addressData.citycode?.trim() || membershipAddress.citycode?.trim() || "";

  const fetchStreetSuggestions = useCallback(
    (query: string) => {
      if (!citycode) return Promise.resolve([]);
      return searchAddresses(query, citycode);
    },
    [citycode],
  );

  const resetForm = useCallback(() => {
    if (initialData) {
      setType(initialData.type);
      setCategorySlug(initialData.categorySlug as AnnouncementCategorySlug);
      setTitle(initialData.title);
      setDescription((initialData.description ?? "").slice(0, DESCRIPTION_MAX));
      setTargetDate(initialData.targetDate);
      setPendingFile(null);
      const addr = {
        street: initialData.addressStreet,
        city: initialData.addressCity,
        citycode: initialData.addressCitycode,
        postcode: initialData.addressPostcode,
        lat: initialData.addressLat as number | null,
        lng: initialData.addressLng as number | null,
      };
      setAddressData(addr);
      setAddressConfirmed(true);
    } else {
      const initial = getInitialFormState(presetType);
      const address = getInitialAddressState(membershipAddress);
      setType(initial.type);
      setCategorySlug(initial.categorySlug);
      setTitle(initial.title);
      setDescription(initial.description);
      setTargetDate(initial.targetDate);
      setPendingFile(initial.pendingFile);
      setAddressData(address.addressData);
      setAddressConfirmed(address.addressConfirmed);
    }
    setAddressStreetError(null);
    setFormError(null);
    setSubmitting(false);
    setSubmitPhase("idle");
  }, [presetType, membershipAddress, initialData]);

  useEffect(() => {
    if (!open) return;
    resetForm();
  }, [open, presetType, resetForm]);

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
        photoUrl = await uploadImageToCloudinary(pendingFile, "announcement");
      }

      setSubmitPhase("publishing");
      const fd = new FormData();
      fd.set("type", type);
      fd.set("categorySlug", categorySlug);
      fd.set("title", title);
      fd.set("description", description.trim());
      fd.set("targetDate", targetDate);
      fd.set("photoUrl", photoUrl || (initialData?.photoUrl ?? ""));
      fd.set("addressStreet", addressData.street.trim());
      fd.set("addressCity", addressData.city.trim());
      fd.set("addressCitycode", addressData.citycode.trim());
      fd.set("addressPostcode", addressData.postcode.trim());
      fd.set("addressLat", String(addressData.lat));
      fd.set("addressLng", String(addressData.lng));

      if (editId) {
        const result = await updateAnnouncement(editId, fd);
        if ("error" in result) {
          setFormError(result.error);
          setSubmitting(false);
          setSubmitPhase("idle");
          return;
        }
        setSubmitting(false);
        setSubmitPhase("idle");
        onClose();
        router.refresh();
      } else {
        const { id } = await createAnnouncement(fd);
        if (draftKey) clearFormDraft(draftKey);
        setSubmitting(false);
        setSubmitPhase("idle");
        onClose();
        router.push(ROUTES.annonces.detail(id));
      }
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
      title={isEditMode ? "Modifier votre annonce" : "Créer une nouvelle annonce"}
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
        <div className="rounded-xl border border-sun/30 bg-sun/10 px-4 py-3">
          <p className="text-sm font-bold text-text">
            Conseils pour une annonce réussie ✨
          </p>
          <ul className="mt-2 space-y-1.5">
            {ANNOUNCEMENT_TIPS.map((tip) => (
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
          <SectionHeading number={1} title="Que souhaitez-vous faire ?" />
          <div className="grid grid-cols-2 gap-3">
            <TypeCard
              selected={type === "demande"}
              onClick={() => setType("demande")}
              title="Je demande"
              subtitle="J'ai besoin d'aide"
              gradient={getAnnouncementTypeConfig("demande")!.gradient}
              icon={
                <AnnouncementTypeIcon
                  type="demande"
                  className="size-4 text-white md:size-5"
                  strokeWidth={2.25}
                />
              }
            />
            <TypeCard
              selected={type === "offre"}
              onClick={() => setType("offre")}
              title="J'offre"
              subtitle="Je propose mon aide"
              gradient={getAnnouncementTypeConfig("offre")!.gradient}
              icon={
                <AnnouncementTypeIcon
                  type="offre"
                  className="size-4 text-white md:size-5"
                  strokeWidth={2.25}
                />
              }
            />
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeading number={2} title="Choisissez une catégorie" />
          <CategorySelectMobile
            value={categorySlug}
            onChange={setCategorySlug}
          />
          <div className="hidden grid-cols-3 gap-2 sm:grid sm:grid-cols-4">
            {ANNOUNCEMENT_CATEGORIES.map((cat) => {
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
                      ? { borderColor: cat.colorHex, backgroundColor: `${cat.colorHex}12` }
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
          <SectionHeading number={3} title="Décrivez votre annonce" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-3">
            <FormField label="Titre de votre annonce *" className="min-w-0 flex-1">
              <div className="relative">
                <Input
                  name="title"
                  required
                  maxLength={TITLE_MAX}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex : Besoin d'aide pour déménager ce samedi"
                  className="pr-14"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-subtle">
                  {title.length}/{TITLE_MAX}
                </span>
              </div>
            </FormField>
            <FormField label="Quand ? (optionnel)" className="w-fit shrink-0">
              <DatePickerField
                value={targetDate}
                onChange={setTargetDate}
                placeholder="Choisir une date"
                className="w-fit min-w-[11.5rem]"
              />
            </FormField>
          </div>
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
                placeholder="Décrivez votre besoin, le contexte, ce que vous recherchez…"
                className="max-h-96 overflow-y-auto pb-8 field-sizing-fixed resize-none"
              />
              <span className="pointer-events-none absolute right-3 bottom-2 text-xs font-medium text-subtle">
                {description.length}/{DESCRIPTION_MAX}
              </span>
            </div>
          </FormField>
        </section>

        <section className="space-y-4">
          <SectionHeading number={4} title="Où se situe l'annonce ?" />
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
              disabled={!citycode}
            />
            {addressStreetError ? (
              <p className="mt-1.5 text-xs font-medium text-coral" role="alert">
                {addressStreetError}
              </p>
            ) : null}
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
            gradient="hero"
            className="sm:min-w-[200px]"
            disabled={submitting || !canSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {submitPhase === "uploading" ? "Envoi de la photo…" : isEditMode ? "Enregistrement…" : "Publication…"}
              </>
            ) : (
              isEditMode ? "Enregistrer les modifications" : "Publier mon annonce"
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
  category: AnnouncementCategory;
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
      style={{ backgroundColor: `${category.colorHex}22`, color: category.colorHex }}
    >
      <Icon className={cn("size-3.5", iconClassName)} strokeWidth={2} aria-hidden />
    </span>
  );
}

function CategorySelectMobile({
  value,
  onChange,
}: {
  value: AnnouncementCategorySlug;
  onChange: (slug: AnnouncementCategorySlug) => void;
}) {
  const selected = getCategoryBySlug(value);

  return (
    <div className="sm:hidden">
      <Select
        value={value}
        onValueChange={(next) => onChange(next as AnnouncementCategorySlug)}
      >
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
            <span className="truncate font-medium text-text">{selected.label}</span>
          </span>
        ) : (
          <span className="text-subtle">Choisir une catégorie</span>
        )}
      </SelectTrigger>
      <SelectContent align="start" className="max-h-64">
        <SelectGroup>
          {ANNOUNCEMENT_CATEGORIES.map((cat) => (
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

function TypeCard({
  selected,
  onClick,
  title,
  subtitle,
  gradient,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  gradient: AnnouncementTypeGradient;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 px-3 py-4 text-center transition sm:flex-row sm:items-center sm:gap-3 sm:pl-5 sm:pr-3 sm:text-left",
        selected
          ? "border-purple bg-soft-pink shadow-sm"
          : "border-border bg-surface hover:border-purple/20",
      )}
    >
      {selected ? (
        <span className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-purple text-white">
          <Check className="size-2.5" strokeWidth={3} aria-hidden />
        </span>
      ) : null}
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full md:size-10",
          gradient,
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 sm:flex-1">
        <p className="text-sm font-bold text-text">{title}</p>
        <p className="mt-0.5 text-xs font-medium text-muted">{subtitle}</p>
      </div>
    </button>
  );
}
