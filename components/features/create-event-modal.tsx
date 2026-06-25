"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, Check, Loader2, MapPin, Sparkles, Users } from "lucide-react";
import { createEventFromModal, updateEvent } from "@/lib/actions/events";
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
import { localDateTimeToIso } from "@/lib/utils/date";
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
import { DatePickerField } from "@/components/ui/date-picker-field";
import { TimePickerField } from "@/components/ui/time-picker-field";
import { cn } from "@/lib/utils/cn";
import type { EventEditData, MembershipAddress } from "@/lib/types";

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 3000;

const EVENT_TIPS = [
  "Précisez la date, l'heure et le lieu de l'événement.",
  "Indiquez combien de bénévoles seraient utiles.",
  "Décrivez ce que les participants peuvent attendre.",
  "Soyez accueillant : tout le monde est bienvenu !",
] as const;

type SubmitPhase = "idle" | "uploading" | "publishing" | "redirecting";

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
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  volunteersNeeded: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
  communeId: string;
  membershipAddress: MembershipAddress;
  editId?: string;
  initialData?: EventEditData;
  duplicateMode?: boolean;
  isOfficial?: boolean;
  detailHref?: (id: string) => string;
};

function parseDateTime(isoString: string): { date: string; time: string } {
  if (!isoString) return { date: "", time: "" };
  try {
    const parsed = parseISO(isoString);
    if (!isValid(parsed)) return { date: "", time: "" };
    return {
      date: format(parsed, "yyyy-MM-dd"),
      time: format(parsed, "HH:mm"),
    };
  } catch {
    return { date: "", time: "" };
  }
}

function combineDateAndTime(date: string, time: string): string | null {
  return localDateTimeToIso(date, time);
}

function isDateBefore(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a < b;
}

function resolveEndDateAfterStartChange(startDate: string, endDate: string): string {
  if (!startDate) return endDate;
  if (!endDate || isDateBefore(endDate, startDate)) return startDate;
  return endDate;
}

function clampEndDate(endDate: string, startDate: string): string {
  if (!startDate) return endDate;
  if (!endDate || isDateBefore(endDate, startDate)) return startDate;
  return endDate;
}

function getInitialAddressFromEditData(
  initialData: EventEditData,
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

export function CreateEventModal({
  open,
  onClose,
  onCreated,
  communeId,
  membershipAddress,
  editId,
  initialData,
  duplicateMode = false,
  isOfficial = false,
  detailHref = ROUTES.evenements.detail,
}: Props) {
  const router = useRouter();
  const isEditMode = Boolean(editId) && !duplicateMode;
  const draftKey = isEditMode || duplicateMode ? null : `event:${communeId}`;

  const initialAddress = useMemo(
    () =>
      initialData
        ? getInitialAddressFromEditData(initialData)
        : getInitialAddressState(membershipAddress),
    [membershipAddress, initialData],
  );

  const initialStartDateTime = useMemo(
    () => (initialData?.startsAt ? parseDateTime(initialData.startsAt) : { date: "", time: "" }),
    [initialData],
  );
  const initialEndDateTime = useMemo(
    () => (initialData?.endsAt ? parseDateTime(initialData.endsAt) : { date: "", time: "" }),
    [initialData],
  );

  const [categorySlug, setCategorySlug] = useState<string>(
    initialData?.categorySlug ?? INITIATIVE_CATEGORIES[0]?.slug ?? "solidarite",
  );
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [startDate, setStartDate] = useState(initialStartDateTime.date);
  const [startTime, setStartTime] = useState(initialStartDateTime.time);
  const [endDate, setEndDate] = useState(initialEndDateTime.date);
  const [endTime, setEndTime] = useState(initialEndDateTime.time);
  const [volunteersNeeded, setVolunteersNeeded] = useState<string>(
    initialData?.volunteersNeeded != null ? String(initialData.volunteersNeeded) : "",
  );
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [addressData, setAddressData] = useState<AddressFormState>(
    initialAddress.addressData,
  );
  const [addressConfirmed, setAddressConfirmed] = useState(
    initialAddress.addressConfirmed,
  );
  const [addressStreetError, setAddressStreetError] = useState<string | null>(null);
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
      setCategorySlug(initialData.categorySlug);
      setTitle(duplicateMode ? `${initialData.title} (copie)` : initialData.title);
      setDescription(initialData.description);
      const startDT = parseDateTime(initialData.startsAt);
      const endDT = parseDateTime(initialData.endsAt);
      setStartDate(startDT.date);
      setStartTime(startDT.time);
      setEndDate(endDT.date);
      setEndTime(endDT.time);
      setVolunteersNeeded(
        initialData.volunteersNeeded != null ? String(initialData.volunteersNeeded) : "",
      );
      setPendingFile(null);
      const address = getInitialAddressFromEditData(initialData);
      setAddressData(address.addressData);
      setAddressConfirmed(address.addressConfirmed);
    } else {
      const address = getInitialAddressState(membershipAddress);
      setCategorySlug(INITIATIVE_CATEGORIES[0]?.slug ?? "solidarite");
      setTitle("");
      setDescription("");
      setStartDate("");
      setStartTime("");
      setEndDate("");
      setEndTime("");
      setVolunteersNeeded("");
      setPendingFile(null);
      setAddressData(address.addressData);
      setAddressConfirmed(address.addressConfirmed);
    }
    setAddressStreetError(null);
    setFormError(null);
    setSubmitting(false);
    setSubmitPhase("idle");
  }, [membershipAddress, initialData, duplicateMode]);

  useEffect(() => {
    if (!open) return;
    if (draftKey) {
      const saved = readFormDraft<Draft>(draftKey);
      resetForm();
      if (saved) {
        setCategorySlug(saved.categorySlug);
        setTitle(saved.title);
        setDescription(saved.description);
        setStartDate(saved.startDate ?? (saved as { date?: string }).date ?? "");
        setStartTime(saved.startTime);
        setEndDate(saved.endDate ?? saved.startDate ?? (saved as { date?: string }).date ?? "");
        setEndTime(saved.endTime);
        setVolunteersNeeded(saved.volunteersNeeded);
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
      startDate,
      startTime,
      endDate,
      endTime,
      volunteersNeeded,
    });
  }, [open, draftKey, categorySlug, title, description, startDate, startTime, endDate, endTime, volunteersNeeded]);

  const handleAbandon = useCallback(() => {
    if (submitting) return;
    resetForm();
    if (draftKey) clearFormDraft(draftKey);
    onClose();
  }, [submitting, resetForm, draftKey, onClose]);

  const canSubmit =
    title.trim().length >= 3 &&
    description.trim().length >= 1 &&
    startDate.length > 0 &&
    startTime.length > 0 &&
    endDate.length > 0 &&
    endTime.length > 0;

  function handleStartDateChange(nextStartDate: string) {
    setStartDate(nextStartDate);
    setEndDate((prev) => resolveEndDateAfterStartChange(nextStartDate, prev));
  }

  function handleEndDateChange(nextEndDate: string) {
    setEndDate(clampEndDate(nextEndDate, startDate));
  }

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

    const startsAt = combineDateAndTime(startDate, startTime);
    const endsAt = combineDateAndTime(endDate, endTime);

    if (!startsAt || !endsAt) {
      setFormError("Veuillez renseigner la date et les heures de l'événement.");
      return;
    }

    if (new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
      setFormError(
        "La date et l'heure de fin doivent être postérieures ou égales à la date et l'heure de début.",
      );
      return;
    }

    if (!isEditMode && new Date(endsAt).getTime() <= Date.now()) {
      setFormError("L'événement doit se terminer dans le futur.");
      return;
    }

    setSubmitting(true);

    try {
      let photoUrl = "";

      if (pendingFile) {
        setSubmitPhase("uploading");
        photoUrl = await uploadImageToCloudinary(pendingFile, "event");
      }

      setSubmitPhase("publishing");

      const payload = {
        categorySlug,
        title: title.trim(),
        description: description.trim(),
        photoUrl: photoUrl || (initialData?.photoUrl ?? ""),
        startsAt,
        endsAt,
        volunteersNeeded: volunteersNeeded ? Number.parseInt(volunteersNeeded, 10) : null,
        addressStreet: addressData.street.trim() || undefined,
        addressCity: addressData.city.trim() || undefined,
        addressCitycode: addressData.citycode.trim() || undefined,
        addressPostcode: addressData.postcode.trim() || undefined,
        addressLat: addressData.lat ?? undefined,
        addressLng: addressData.lng ?? undefined,
        sourceInitiativeId: initialData?.sourceInitiativeId,
        isOfficial: isEditMode ? undefined : isOfficial,
      };

      if (isEditMode && editId) {
        const result = await updateEvent(editId, payload);
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

      const result = await createEventFromModal(payload);
      if ("error" in result) {
        setFormError(result.error);
        setSubmitting(false);
        setSubmitPhase("idle");
        return;
      }

      if (draftKey) clearFormDraft(draftKey);

      if (onCreated) {
        setSubmitPhase("redirecting");
        onCreated(result.id);
        return;
      }

      setSubmitPhase("redirecting");
      onClose();
      router.push(detailHref(result.id));
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

  const modalTitle = isEditMode
    ? "Modifier l'événement"
    : duplicateMode
      ? "Dupliquer l'événement"
      : "Créer un événement";

  return (
    <Modal
      open={open}
      onClose={handleAbandon}
      closeDisabled={submitting}
      title={modalTitle}
      size="xl"
      showCloseButton
      className="sm:max-w-3xl"
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-8 pb-2"
      >
        <div className="rounded-xl border border-orange/30 bg-orange/5 px-4 py-3">
          <p className="text-sm font-bold text-text">
            Conseils pour un événement réussi{" "}
            <Sparkles className="inline size-4 text-orange" aria-hidden />
          </p>
          <ul className="mt-2 space-y-1.5">
            {EVENT_TIPS.map((tip) => (
              <li
                key={tip}
                className="flex items-start gap-2 text-sm font-medium text-muted"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-orange" aria-hidden />
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
          <SectionHeading number={2} title="Décrivez votre événement" />
          <FormField label="Titre de l'événement *">
            <div className="relative">
              <Input
                name="title"
                required
                maxLength={TITLE_MAX}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex : Atelier réparation vélos"
                className="pr-14"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-subtle">
                {title.length}/{TITLE_MAX}
              </span>
            </div>
          </FormField>
          <FormField label="Description *">
            <div className="relative">
              <Textarea
                name="description"
                required
                rows={5}
                maxLength={DESCRIPTION_MAX}
                value={description}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next.length <= DESCRIPTION_MAX) {
                    setDescription(next);
                  }
                }}
                placeholder="Décrivez l'événement, son objectif, ce que les participants peuvent attendre…"
                className="max-h-96 overflow-y-auto pb-8 field-sizing-fixed resize-none"
              />
              <span className="pointer-events-none absolute right-3 bottom-2 text-xs font-medium text-subtle">
                {description.length}/{DESCRIPTION_MAX}
              </span>
            </div>
          </FormField>
        </section>

        <section className="space-y-4">
          <SectionHeading number={3} title="Quand a lieu l'événement ?" />
          <div className="flex flex-nowrap items-end gap-6">
            <div className="flex flex-nowrap items-end gap-4">
              <FormField label="Date de début *" className="shrink-0">
                <DatePickerField
                  value={startDate}
                  onChange={handleStartDateChange}
                  minDate={isEditMode ? undefined : format(new Date(), "yyyy-MM-dd")}
                  placeholder="Choisir une date"
                  className="w-[12rem]"
                />
              </FormField>
              <FormField label="Heure de début *" className="shrink-0">
                <TimePickerField
                  value={startTime}
                  onChange={setStartTime}
                  placeholder="Début"
                  className="w-[7.5rem]"
                />
              </FormField>
            </div>
            <div className="flex flex-nowrap items-end gap-4">
              <FormField label="Date de fin *" className="shrink-0">
                <DatePickerField
                  value={endDate}
                  onChange={handleEndDateChange}
                  minDate={startDate || undefined}
                  placeholder="Choisir une date"
                  className="w-[12rem]"
                />
              </FormField>
              <FormField label="Heure de fin *" className="shrink-0">
                <TimePickerField
                  value={endTime}
                  onChange={setEndTime}
                  placeholder="Fin"
                  className="w-[7.5rem]"
                />
              </FormField>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading number={4} title="Bénévoles (optionnel)" />
          <FormField label="Nombre de bénévoles souhaités">
            <div className="relative max-w-[200px]">
              <Users className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <Input
                type="number"
                min={0}
                value={volunteersNeeded}
                onChange={(e) => setVolunteersNeeded(e.target.value)}
                placeholder="0"
                className="pl-10"
              />
            </div>
            <p className="mt-1.5 text-xs font-medium text-subtle">
              Laissez vide si vous n&apos;avez pas besoin de bénévoles
            </p>
          </FormField>
        </section>

        <section className="space-y-4">
          <SectionHeading number={5} title="Où se déroule l'événement ? (optionnel)" />
          <FormField label="Rue">
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
            <FormField label="Code postal">
              <Input
                name="addressPostcode"
                autoComplete="postal-code"
                inputMode="numeric"
                value={addressData.postcode}
                onChange={(e) => handlePostcodeChange(e.target.value)}
                placeholder="27000"
              />
            </FormField>
            <FormField label="Ville">
              <Input
                name="addressCity"
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
            gradient="events"
            className="sm:min-w-[200px]"
            disabled={submitting || !canSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {submitPhase === "uploading"
                  ? "Envoi de la photo…"
                  : submitPhase === "redirecting"
                    ? "Ouverture…"
                  : isEditMode
                    ? "Enregistrement…"
                    : "Publication…"}
              </>
            ) : isEditMode ? (
              "Enregistrer les modifications"
            ) : duplicateMode ? (
              "Créer la copie"
            ) : (
              "Publier l'événement"
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
