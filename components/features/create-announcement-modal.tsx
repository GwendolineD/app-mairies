"use client";

import { useEffect, useState } from "react";
import { Check, HandHeart, Plus } from "lucide-react";
import { createAnnouncement } from "@/lib/actions/announcements";
import {
  ANNOUNCEMENT_CATEGORIES,
  type AnnouncementCategorySlug,
} from "@/lib/constants/announcement-categories";
import type { AnnouncementType } from "@/lib/constants/announcement-types";
import {
  clearFormDraft,
  readFormDraft,
  writeFormDraft,
} from "@/lib/utils/form-draft";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { FormField, Input, Textarea } from "@/components/ui/form-field";
import { GradientButton } from "@/components/ui/gradient-button";
import { Modal } from "@/components/ui/modal";
import { ImageDropzone } from "@/components/features/image-dropzone";
import { cn } from "@/lib/utils/cn";

const DESCRIPTION_MAX = 1000;

const ANNOUNCEMENT_TIPS = [
  "Choisissez un titre court et explicite",
  "Décrivez le contexte et ce dont vous avez besoin",
  "Indiquez vos disponibilités si vous le souhaitez",
  "Restez bienveillant·e dans vos échanges",
] as const;

type Draft = {
  type: AnnouncementType;
  categorySlug: AnnouncementCategorySlug;
  title: string;
  description: string;
  targetDate: string;
  photoUrl: string;
};

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
      <span className="text-purple">{number}. </span>
      {title}
    </h3>
  );
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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const saved = readFormDraft<Draft>(draftKey);
    if (saved) {
      setType(saved.type);
      setCategorySlug(saved.categorySlug);
      setTitle(saved.title);
      setDescription(saved.description);
      setTargetDate(saved.targetDate);
      setPhotoUrl(saved.photoUrl || null);
    } else {
      setType(presetType);
      setCategorySlug(ANNOUNCEMENT_CATEGORIES[0].slug);
    }
  }, [open, presetType, draftKey]);

  useEffect(() => {
    if (!open) return;
    writeFormDraft(draftKey, {
      type,
      categorySlug,
      title,
      description,
      targetDate,
      photoUrl: photoUrl ?? "",
    });
  }, [
    open,
    draftKey,
    type,
    categorySlug,
    title,
    description,
    targetDate,
    photoUrl,
  ]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (description.trim().length < 10) {
      setFormError("La description doit contenir au moins 10 caractères.");
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.set("type", type);
    fd.set("categorySlug", categorySlug);
    fd.set("title", title);
    fd.set("description", description);
    fd.set("targetDate", targetDate);
    fd.set("photoUrl", photoUrl ?? "");
    await createAnnouncement(fd);
    clearFormDraft(draftKey);
    setSubmitting(false);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Créer une nouvelle annonce"
      size="xl"
      showCloseButton
      className="sm:max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-8 pb-2">
        <section className="space-y-3">
          <SectionHeading number={1} title="Que souhaitez-vous faire ?" />
          <div className="grid grid-cols-2 gap-3">
            <TypeCard
              selected={type === "demande"}
              onClick={() => setType("demande")}
              title="Je demande"
              subtitle="J'ai besoin d'aide"
              borderClass="border-orange"
              bgClass="bg-orange/5"
              icon={<HandHeart className="size-8 text-orange" strokeWidth={1.75} />}
            />
            <TypeCard
              selected={type === "offre"}
              onClick={() => setType("offre")}
              title="J'offre"
              subtitle="Je propose mon aide"
              borderClass="border-mint"
              bgClass="bg-mint/10"
              icon={<Plus className="size-8 text-mint" strokeWidth={2.5} />}
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
                    "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition",
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
                  <span
                    className="flex size-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${cat.colorHex}22`, color: cat.colorHex }}
                  >
                    <Icon className="size-5" strokeWidth={2} aria-hidden />
                  </span>
                  <span className="text-[11px] leading-tight font-semibold text-text">
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading number={3} title="Décrivez votre annonce" />
          <FormField label="Titre de votre annonce *">
            <Input
              name="title"
              required
              minLength={3}
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Besoin d'aide pour déménager ce samedi"
            />
          </FormField>
          <FormField label="Description détaillée *">
            <div className="relative">
              <Textarea
                name="description"
                required
                rows={5}
                maxLength={DESCRIPTION_MAX}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre besoin, le contexte, ce que vous recherchez…"
                className="pb-8"
              />
              <span className="pointer-events-none absolute right-3 bottom-2 text-xs font-medium text-subtle">
                {description.length}/{DESCRIPTION_MAX}
              </span>
            </div>
          </FormField>
        </section>

        <section className="space-y-4">
          <SectionHeading number={4} title="Informations pratiques" />
          <FormField label="Quand ? (optionnel)">
            <DatePickerField
              value={targetDate}
              onChange={setTargetDate}
              placeholder="Choisir une date"
            />
          </FormField>

          <ImageDropzone
            value={photoUrl}
            onChange={setPhotoUrl}
            communeId={communeId}
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
        </section>

        {formError ? (
          <p className="text-sm font-medium text-coral" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="sm:min-w-[120px]"
          >
            Annuler
          </Button>
          <GradientButton
            type="submit"
            gradient="hero"
            className="sm:min-w-[200px]"
            disabled={submitting}
          >
            {submitting ? "Publication…" : "Publier mon annonce"}
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
  borderClass,
  bgClass,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  borderClass: string;
  bgClass: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 px-3 py-5 text-center transition",
        selected ? cn(borderClass, bgClass) : "border-border bg-surface hover:border-purple/20",
      )}
    >
      {selected ? (
        <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-purple text-white">
          <Check className="size-3" strokeWidth={3} aria-hidden />
        </span>
      ) : null}
      {icon}
      <div>
        <p className="text-sm font-bold text-text">{title}</p>
        <p className="mt-0.5 text-xs font-medium text-muted">{subtitle}</p>
      </div>
    </button>
  );
}
