// @ts-nocheck
"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  createAnnouncementCategory,
  updateAnnouncementCategory,
  deleteAnnouncementCategory,
  type CategoryFormState,
} from "@/lib/actions/announcement-categories";
import type { AnnouncementCategoryRow } from "@/lib/types";
import { ALLOWED_ICON_NAMES, resolveIcon } from "@/lib/utils/lucide-icon-map";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { FormField, Input } from "@/components/ui/form-field";
import { cn } from "@/lib/utils/cn";

type Props = {
  categories: AnnouncementCategoryRow[];
};

export function CategoriesGrid({ categories }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<AnnouncementCategoryRow | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<AnnouncementCategoryRow | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden />
          <span>Ajouter une catégorie</span>
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card className="p-6 text-sm font-medium text-muted">
          Aucune catégorie trouvée.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.slug}
              category={cat}
              onEdit={() => setEditCategory(cat)}
              onDelete={() => setDeleteCategory(cat)}
            />
          ))}
        </div>
      )}

      <CreateCategoryModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {editCategory ? (
        <EditCategoryModal
          category={editCategory}
          open={!!editCategory}
          onClose={() => setEditCategory(null)}
        />
      ) : null}

      {deleteCategory ? (
        <DeleteCategoryModal
          category={deleteCategory}
          open={!!deleteCategory}
          onClose={() => setDeleteCategory(null)}
        />
      ) : null}
    </div>
  );
}

function CategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: AnnouncementCategoryRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = resolveIcon(category.icon_name);

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${category.color_hex}22`, color: category.color_hex }}
          >
            <Icon className="size-5" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-text">{category.label}</p>
            <p className="text-xs text-muted">{category.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-sm text-muted transition hover:bg-warm hover:text-text"
            aria-label="Modifier"
          >
            <Pencil className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-sm text-muted transition hover:bg-coral/10 hover:text-coral"
            aria-label="Supprimer"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span
          className="inline-block size-4 rounded-full border border-border"
          style={{ backgroundColor: category.color_hex }}
          title={category.color_hex}
        />
        <span className="text-muted">Ordre : {category.sort_order}</span>
      </div>

      <div className="flex gap-2">
        {category.map_pin_url ? (
          <img
            src={category.map_pin_url}
            alt="Pin carte"
            className="size-9 rounded border border-border object-contain"
          />
        ) : (
          <span className="flex size-9 items-center justify-center rounded border border-dashed border-border text-[10px] text-muted">
            Pin
          </span>
        )}
        {category.default_image_url ? (
          <img
            src={category.default_image_url}
            alt="Image par défaut"
            className="h-9 w-16 rounded border border-border object-cover"
          />
        ) : (
          <span className="flex h-9 w-16 items-center justify-center rounded border border-dashed border-border text-[10px] text-muted">
            Image
          </span>
        )}
      </div>
    </Card>
  );
}

const initialState: CategoryFormState = { success: false };

type CategoryFormValues = {
  label: string;
  color_hex: string;
  sort_order: number;
  icon_name: string;
  map_pin_url: string;
  default_image_url: string;
};

function getCategoryFormValues(
  defaultValues?: AnnouncementCategoryRow,
): CategoryFormValues {
  return {
    label: defaultValues?.label ?? "",
    color_hex: defaultValues?.color_hex ?? "#A8A8A8",
    sort_order: defaultValues?.sort_order ?? 0,
    icon_name: defaultValues?.icon_name ?? "more-horizontal",
    map_pin_url: defaultValues?.map_pin_url ?? "",
    default_image_url: defaultValues?.default_image_url ?? "",
  };
}

function isCategoryFormDirty(
  initial: CategoryFormValues,
  current: CategoryFormValues,
): boolean {
  return (
    current.label !== initial.label ||
    current.color_hex.toLowerCase() !== initial.color_hex.toLowerCase() ||
    current.sort_order !== initial.sort_order ||
    current.icon_name !== initial.icon_name ||
    current.map_pin_url !== initial.map_pin_url ||
    current.default_image_url !== initial.default_image_url
  );
}

function CreateCategoryModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createAnnouncementCategory,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onClose();
    }
  }, [state.success, router, onClose]);

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle catégorie" size="lg">
      <form action={formAction}>
        <CategoryFormFields state={state} />
        <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isPending}>
            {isPending ? "Création…" : "Créer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EditCategoryModal({
  category,
  open,
  onClose,
}: {
  category: AnnouncementCategoryRow;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const boundAction = updateAnnouncementCategory.bind(null, category.slug);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsDirty(false);
  }, [open, category.slug]);

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onClose();
    }
  }, [state.success, router, onClose]);

  return (
    <Modal open={open} onClose={onClose} title="Modifier la catégorie" size="lg">
      <form action={formAction} key={category.slug}>
        <CategoryFormFields
          state={state}
          defaultValues={category}
          isEdit
          onDirtyChange={setIsDirty}
        />
        <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isPending || !isDirty}
          >
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteCategoryModal({
  category,
  open,
  onClose,
}: {
  category: AnnouncementCategoryRow;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleDelete() {
    setIsPending(true);
    setError(null);
    const result = await deleteAnnouncementCategory(category.slug);
    setIsPending(false);

    if (result.success) {
      router.refresh();
      onClose();
    } else {
      setError(result.error ?? "Erreur inconnue");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Supprimer la catégorie">
      <div className="space-y-4">
        <p className="text-sm text-text">
          Êtes-vous sûr de vouloir supprimer la catégorie{" "}
          <span className="font-semibold">{category.label}</span> ?
        </p>
        <p className="text-sm text-muted">
          Cette action est irréversible. Si des annonces utilisent cette catégorie,
          la suppression sera impossible.
        </p>
        {error ? (
          <p className="rounded-sm bg-coral/10 px-3 py-2 text-sm font-medium text-coral">
            {error}
          </p>
        ) : null}
      </div>
      <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Annuler
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          disabled={isPending}
          onClick={handleDelete}
        >
          {isPending ? "Suppression…" : "Supprimer"}
        </Button>
      </div>
    </Modal>
  );
}

function CategoryFormFields({
  state,
  defaultValues,
  isEdit,
  onDirtyChange,
}: {
  state: CategoryFormState;
  defaultValues?: AnnouncementCategoryRow;
  isEdit?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const initialValues = useMemo(
    () => getCategoryFormValues(defaultValues),
    [defaultValues],
  );
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  useEffect(() => {
    if (!isEdit || !onDirtyChange) return;
    onDirtyChange(isCategoryFormDirty(initialValues, values));
  }, [initialValues, isEdit, onDirtyChange, values]);

  const selectedIcon = values.icon_name;
  const color = values.color_hex;

  function updateValues(partial: Partial<CategoryFormValues>) {
    setValues((current) => ({ ...current, ...partial }));
  }

  return (
    <div className="space-y-4">
      {state.error && !state.fieldErrors ? (
        <p className="rounded-sm bg-coral/10 px-3 py-2 text-sm font-medium text-coral">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Slug"
          error={state.fieldErrors?.slug}
        >
          <Input
            name="slug"
            defaultValue={defaultValues?.slug}
            placeholder="ex: bricolage"
            readOnly={isEdit}
            className={isEdit ? "cursor-not-allowed bg-warm text-muted" : undefined}
          />
        </FormField>

        <FormField
          label="Libellé"
          error={state.fieldErrors?.label}
        >
          <Input
            name="label"
            value={isEdit ? values.label : undefined}
            defaultValue={isEdit ? undefined : defaultValues?.label}
            onChange={
              isEdit
                ? (event) => updateValues({ label: event.target.value })
                : undefined
            }
            placeholder="ex: Bricolage"
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Couleur" error={state.fieldErrors?.color_hex}>
          <input type="hidden" name="color_hex" value={color} />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(event) => updateValues({ color_hex: event.target.value })}
              className="size-10 cursor-pointer rounded-sm border border-border"
            />
            <span className="text-sm font-medium text-muted">{color}</span>
          </div>
        </FormField>

        <FormField label="Ordre" error={state.fieldErrors?.sort_order}>
          <Input
            name="sort_order"
            type="number"
            value={isEdit ? values.sort_order : undefined}
            defaultValue={isEdit ? undefined : (defaultValues?.sort_order ?? 0)}
            onChange={
              isEdit
                ? (event) =>
                    updateValues({
                      sort_order: Number.parseInt(event.target.value, 10) || 0,
                    })
                : undefined
            }
            min={0}
          />
        </FormField>
      </div>

      <FormField label="Icône" error={state.fieldErrors?.icon_name}>
        <input type="hidden" name="icon_name" value={selectedIcon} />
        <div className="grid grid-cols-6 gap-2 rounded-sm border border-border bg-surface p-2 sm:grid-cols-8 md:grid-cols-12">
          {ALLOWED_ICON_NAMES.map((name) => {
            const Icon = resolveIcon(name);
            const isSelected = selectedIcon === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => updateValues({ icon_name: name })}
                className={cn(
                  "flex size-9 cursor-pointer items-center justify-center rounded-sm border transition",
                  isSelected
                    ? "border-purple bg-soft-pink text-purple"
                    : "border-transparent text-muted hover:bg-warm hover:text-text",
                )}
                title={name}
              >
                <Icon className="size-5" strokeWidth={2} aria-hidden />
              </button>
            );
          })}
        </div>
      </FormField>

      <FormField
        label="URL image pin carte"
        error={state.fieldErrors?.map_pin_url}
      >
        <Input
          name="map_pin_url"
          type="url"
          value={isEdit ? values.map_pin_url : undefined}
          defaultValue={isEdit ? undefined : (defaultValues?.map_pin_url ?? "")}
          onChange={
            isEdit
              ? (event) => updateValues({ map_pin_url: event.target.value })
              : undefined
          }
          placeholder="https://..."
        />
      </FormField>

      <FormField
        label="URL image par défaut"
        error={state.fieldErrors?.default_image_url}
      >
        <Input
          name="default_image_url"
          type="url"
          value={isEdit ? values.default_image_url : undefined}
          defaultValue={isEdit ? undefined : (defaultValues?.default_image_url ?? "")}
          onChange={
            isEdit
              ? (event) => updateValues({ default_image_url: event.target.value })
              : undefined
          }
          placeholder="https://..."
        />
      </FormField>
    </div>
  );
}
