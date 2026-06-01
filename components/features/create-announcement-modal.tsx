"use client";

import { useEffect, useState } from "react";
import { createAnnouncement } from "@/lib/actions/announcements";
import {
  ANNOUNCEMENT_TYPES,
  type AnnouncementType,
} from "@/lib/constants/announcement-types";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/constants/announcement-categories";
import {
  clearFormDraft,
  readFormDraft,
  writeFormDraft,
} from "@/lib/utils/form-draft";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select, Textarea } from "@/components/ui/form-field";
import { GradientButton } from "@/components/ui/gradient-button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils/cn";

type Draft = {
  type: AnnouncementType;
  categorySlug: string;
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

export function CreateAnnouncementModal({
  open,
  onClose,
  communeId,
  presetType = "demande",
}: Props) {
  const draftKey = `announcement:${communeId}`;
  const [type, setType] = useState<AnnouncementType>(presetType);
  const [categorySlug, setCategorySlug] = useState<string>(ANNOUNCEMENT_CATEGORIES[0].slug);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const saved = readFormDraft<Draft>(draftKey);
    if (saved) {
      setType(saved.type);
      setCategorySlug(saved.categorySlug);
      setTitle(saved.title);
      setDescription(saved.description);
      setTargetDate(saved.targetDate);
      setPhotoUrl(saved.photoUrl);
    } else {
      setType(presetType);
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
      photoUrl,
    });
  }, [open, draftKey, type, categorySlug, title, description, targetDate, photoUrl]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData();
    fd.set("type", type);
    fd.set("categorySlug", categorySlug);
    fd.set("title", title);
    fd.set("description", description);
    fd.set("targetDate", targetDate);
    fd.set("photoUrl", photoUrl);
    await createAnnouncement(fd);
    clearFormDraft(draftKey);
    setSubmitting(false);
    onClose();
  }

  const titleCopy =
    type === "demande"
      ? "Décrivez ce dont vous avez besoin"
      : "Décrivez ce que vous proposez";

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle annonce" size="lg">
      <p className="mb-4 text-sm font-medium text-muted">{titleCopy}</p>

      <div className="mb-4 flex gap-2">
        {ANNOUNCEMENT_TYPES.map((t) => (
          <button
            key={t.slug}
            type="button"
            onClick={() => setType(t.slug)}
            className={cn(
              "flex-1 cursor-pointer rounded-sm border px-3 py-2 text-sm font-semibold transition",
              type === t.slug
                ? t.slug === "demande"
                  ? "border-orange bg-orange/10 text-orange"
                  : "border-aqua bg-aqua/10 text-aqua"
                : "border-border bg-surface text-muted hover:border-purple/30",
            )}
          >
            {t.slug === "demande" ? "Je demande" : "J'offre"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormField label="Catégorie">
          <Select
            name="categorySlug"
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
          >
            {ANNOUNCEMENT_CATEGORIES.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Titre">
          <Input
            name="title"
            required
            minLength={3}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Court et chaleureux"
          />
        </FormField>

        <FormField label="Description (optionnel)">
          <Textarea
            name="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Horaires, durée estimée…"
          />
        </FormField>

        <FormField label="Date souhaitée (optionnel)">
          <Input
            name="targetDate"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </FormField>

        <FormField label="Photo · URL Cloudinary (optionnel)">
          <Input
            type="url"
            name="photoUrl"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="https://res.cloudinary.com/..."
          />
        </FormField>

        <div className="mt-2 flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <GradientButton
            type="submit"
            gradient={type === "demande" ? "demande" : "offre"}
            className="flex-1"
            disabled={submitting}
          >
            {submitting ? "Publication…" : "Publier"}
          </GradientButton>
        </div>
      </form>
    </Modal>
  );
}
