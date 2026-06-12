"use client";

import { useEffect, useState } from "react";
import { createInitiative } from "@/lib/actions/initiatives";
import { INITIATIVE_CATEGORIES } from "@/lib/constants/initiative-categories";
import {
  clearFormDraft,
  readFormDraft,
  writeFormDraft,
} from "@/lib/utils/form-draft";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select, Textarea } from "@/components/ui/form-field";
import { GradientButton } from "@/components/ui/gradient-button";
import { Modal } from "@/components/ui/modal";

type Draft = {
  categorySlug: string;
  title: string;
  description: string;
  dateMode: string;
  singleStartsAt: string;
  singleEndsAt: string;
  addressLabel: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  communeId: string;
};

export function CreateInitiativeModal({ open, onClose, communeId }: Props) {
  const draftKey = `initiative:${communeId}`;
  const [categorySlug, setCategorySlug] = useState<string>(INITIATIVE_CATEGORIES[0].slug);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateMode, setDateMode] = useState("none");
  const [singleStartsAt, setSingleStartsAt] = useState("");
  const [singleEndsAt, setSingleEndsAt] = useState("");
  const [addressLabel, setAddressLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const saved = readFormDraft<Draft>(draftKey);
    if (saved) {
      setCategorySlug(saved.categorySlug);
      setTitle(saved.title);
      setDescription(saved.description);
      setDateMode(saved.dateMode);
      setSingleStartsAt(saved.singleStartsAt);
      setSingleEndsAt(saved.singleEndsAt);
      setAddressLabel(saved.addressLabel);
    }
  }, [open, draftKey]);

  useEffect(() => {
    if (!open) return;
    writeFormDraft(draftKey, {
      categorySlug,
      title,
      description,
      dateMode,
      singleStartsAt,
      singleEndsAt,
      addressLabel,
    });
  }, [
    open,
    draftKey,
    categorySlug,
    title,
    description,
    dateMode,
    singleStartsAt,
    singleEndsAt,
    addressLabel,
  ]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData();
    fd.set("categorySlug", categorySlug);
    fd.set("title", title);
    fd.set("description", description);
    fd.set("dateMode", dateMode);
    fd.set("singleStartsAt", singleStartsAt);
    fd.set("singleEndsAt", singleEndsAt);
    fd.set("addressLabel", addressLabel);
    await createInitiative(fd);
    clearFormDraft(draftKey);
    setSubmitting(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Lancer une initiative" size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormField label="Catégorie">
          <Select
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
          >
            {INITIATIVE_CATEGORIES.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Titre">
          <Input
            required
            minLength={3}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormField>

        <FormField label="Description (optionnel)">
          <Textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>

        <FormField label="Lieu (optionnel — sinon votre adresse)">
          <Input
            value={addressLabel}
            onChange={(e) => setAddressLabel(e.target.value)}
            placeholder="12 rue des Acacias"
          />
        </FormField>

        <FormField label="Temporalité">
          <Select value={dateMode} onChange={(e) => setDateMode(e.target.value)}>
            <option value="none">Libre / permanente</option>
            <option value="once">Événement ponctuel</option>
            <option value="recurring">Récurrent</option>
          </Select>
        </FormField>

        {dateMode === "once" ? (
          <fieldset className="space-y-2 rounded-2xl border border-border px-4 py-3">
            <legend className="px-2 text-[10px] font-semibold uppercase text-muted">
              Dates
            </legend>
            <FormField label="Début">
              <Input
                type="datetime-local"
                value={singleStartsAt}
                onChange={(e) => setSingleStartsAt(e.target.value)}
              />
            </FormField>
            <FormField label="Fin">
              <Input
                type="datetime-local"
                value={singleEndsAt}
                onChange={(e) => setSingleEndsAt(e.target.value)}
              />
            </FormField>
          </fieldset>
        ) : null}

        <div className="mt-2 flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <GradientButton
            type="submit"
            gradient="initiative"
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
