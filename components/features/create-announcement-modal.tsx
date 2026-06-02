"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, HandHeart, Loader2, Plus } from "lucide-react";
import { createAnnouncement } from "@/lib/actions/announcements";
import {
  ANNOUNCEMENT_CATEGORIES,
  type AnnouncementCategorySlug,
} from "@/lib/constants/announcement-categories";
import type { AnnouncementType } from "@/lib/constants/announcement-types";
import {
  CloudinaryUploadError,
  uploadImageToCloudinary,
} from "@/lib/services/cloudinary-client";
import { clearFormDraft } from "@/lib/utils/form-draft";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { FormField, Input, Textarea } from "@/components/ui/form-field";
import { GradientButton } from "@/components/ui/gradient-button";
import { Modal } from "@/components/ui/modal";
import { ImageDropzone } from "@/components/features/image-dropzone";
import { cn } from "@/lib/utils/cn";

const TITLE_MAX = 70;
const DESCRIPTION_MAX = 1000;

const ANNOUNCEMENT_TIPS = [
  "Choisissez un titre court et explicite",
  "Décrivez le contexte et ce dont vous avez besoin",
  "Indiquez vos disponibilités si vous le souhaitez",
  "Restez bienveillant·e dans vos échanges",
] as const;

type SubmitPhase = "idle" | "uploading" | "publishing";

type Props = {
  open: boolean;
  onClose: () => void;
  communeId: string;
  presetType?: AnnouncementType;
};

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
  presetType = "demande",
}: Props) {
  const draftKey = `announcement:${communeId}`;
  const [type, setType] = useState<AnnouncementType>(presetType);
  const [categorySlug, setCategorySlug] = useState<AnnouncementCategorySlug>(
    ANNOUNCEMENT_CATEGORIES[0].slug,
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    const initial = getInitialFormState(presetType);
    setType(initial.type);
    setCategorySlug(initial.categorySlug);
    setTitle(initial.title);
    setDescription(initial.description);
    setTargetDate(initial.targetDate);
    setPendingFile(initial.pendingFile);
    setFormError(null);
    setSubmitting(false);
    setSubmitPhase("idle");
  }, [presetType]);

  useEffect(() => {
    if (!open) return;
    resetForm();
  }, [open, presetType, resetForm]);

  const handleAbandon = useCallback(() => {
    if (submitting) return;
    resetForm();
    clearFormDraft(draftKey);
    onClose();
  }, [submitting, resetForm, draftKey, onClose]);

  const canSubmit = title.trim().length > 0 && description.trim().length > 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

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
      fd.set("description", description);
      fd.set("targetDate", targetDate);
      fd.set("photoUrl", photoUrl);
      await createAnnouncement(fd);
      clearFormDraft(draftKey);
      onClose();
    } catch (error) {
      if (error instanceof CloudinaryUploadError) {
        if (error.errorType === "virus_detected") {
          setFormError("Ce fichier a été rejeté pour des raisons de sécurité.");
        } else if (error.errorType === "service_unavailable") {
          setFormError("Service de sécurité indisponible. Réessayez plus tard.");
        } else {
          setFormError(error.message);
        }
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
      title="Créer une nouvelle annonce"
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
        <section className="space-y-3">
          <SectionHeading number={1} title="Que souhaitez-vous faire ?" />
          <div className="grid grid-cols-2 gap-3">
            <TypeCard
              selected={type === "demande"}
              onClick={() => setType("demande")}
              title="Je demande"
              subtitle="J'ai besoin d'aide"
              gradient="gradient-demande"
              icon={
                <HandHeart className="size-4 text-white md:size-5" strokeWidth={2.25} aria-hidden />
              }
            />
            <TypeCard
              selected={type === "offre"}
              onClick={() => setType("offre")}
              title="J'offre"
              subtitle="Je propose mon aide"
              gradient="gradient-offre"
              icon={<Plus className="size-4 text-white md:size-5" strokeWidth={2.5} aria-hidden />}
            />
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeading number={2} title="Choisissez une catégorie" />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {ANNOUNCEMENT_CATEGORIES.map((cat) => {
              const Icon = cat.Icon;
              const selected = categorySlug === cat.slug;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setCategorySlug(cat.slug)}
                  className={cn(
                    "relative flex cursor-pointer flex-row items-center gap-2 rounded-lg border-2 px-2.5 py-2.5 text-left transition",
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
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${cat.colorHex}22`, color: cat.colorHex }}
                  >
                    <Icon className="size-4" strokeWidth={2} aria-hidden />
                  </span>
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
                onChange={(e) => setDescription(e.target.value)}
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
          <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
            <ImageDropzone
              file={pendingFile}
              onFileChange={setPendingFile}
              isUploading={submitPhase === "uploading"}
              className="h-full min-h-0"
            />

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
          </div>
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
                {submitPhase === "uploading" ? "Envoi de la photo…" : "Publication…"}
              </>
            ) : (
              "Publier mon annonce"
            )}
          </GradientButton>
        </div>
      </form>
    </Modal>
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
  gradient: "gradient-demande" | "gradient-offre";
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex cursor-pointer flex-row items-center gap-3 rounded-lg border-2 px-3 py-4 text-left transition",
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
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-text">{title}</p>
        <p className="mt-0.5 text-xs font-medium text-muted">{subtitle}</p>
      </div>
    </button>
  );
}
