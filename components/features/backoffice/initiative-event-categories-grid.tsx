"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  createInitiativeEventCategory,
  updateInitiativeEventCategory,
  deleteInitiativeEventCategory,
  type InitiativeEventCategoryFormState,
} from "@/lib/actions/initiative-event-categories";
import type { InitiativeEventCategoryRow } from "@/lib/types";
import { ALLOWED_ICON_NAMES, resolveIcon } from "@/lib/utils/lucide-icon-map";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { FormField, Input } from "@/components/ui/form-field";
import { cn } from "@/lib/utils/cn";

type Props = {
  categories: InitiativeEventCategoryRow[];
};

export function InitiativeEventCategoriesGrid({ categories }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<InitiativeEventCategoryRow | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<InitiativeEventCategoryRow | null>(null);

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
  category: InitiativeEventCategoryRow;
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

const initialState: InitiativeEventCategoryFormState = { success: false };

function CreateCategoryModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createInitiativeEventCategory,
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
  category: InitiativeEventCategoryRow;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const boundAction = updateInitiativeEventCategory.bind(null, category.slug);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onClose();
    }
  }, [state.success, router, onClose]);

  return (
    <Modal open={open} onClose={onClose} title="Modifier la catégorie" size="lg">
      <form action={formAction}>
        <CategoryFormFields state={state} defaultValues={category} isEdit />
        <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isPending}>
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
  category: InitiativeEventCategoryRow;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleDelete() {
    setIsPending(true);
    setError(null);
    const result = await deleteInitiativeEventCategory(category.slug);
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
          Cette action est irréversible. Si des initiatives ou événements utilisent cette catégorie,
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
}: {
  state: InitiativeEventCategoryFormState;
  defaultValues?: InitiativeEventCategoryRow;
  isEdit?: boolean;
}) {
  const [selectedIcon, setSelectedIcon] = useState(defaultValues?.icon_name ?? "more-horizontal");
  const [color, setColor] = useState(defaultValues?.color_hex ?? "#A8A8A8");

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
        >
          <Input
            defaultValue={defaultValues?.slug}
            placeholder="ex: solidarite"
            readOnly={isEdit}
            className={isEdit ? "cursor-not-allowed bg-warm text-muted" : undefined}
          />
        </FormField>

        <FormField
          label="Libellé"
        >
          <Input
            defaultValue={defaultValues?.label}
            placeholder="ex: Solidarité"
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Couleur">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="size-10 cursor-pointer rounded-sm border border-border"
            />
            <span className="text-sm font-medium text-muted">{color}</span>
          </div>
        </FormField>

        <FormField label="Ordre">
          <Input
            type="number"
            defaultValue={defaultValues?.sort_order ?? 0}
            min={0}
          />
        </FormField>
      </div>

      <FormField label="Icône">
        <input type="hidden" value={selectedIcon} />
        <div className="grid grid-cols-6 gap-2 rounded-sm border border-border bg-surface p-2 sm:grid-cols-8 md:grid-cols-12">
          {ALLOWED_ICON_NAMES.map((name) => {
            const Icon = resolveIcon(name);
            const isSelected = selectedIcon === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedIcon(name)}
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
       
       
      >
        <Input
          type="url"
          defaultValue={defaultValues?.map_pin_url ?? ""}
          placeholder="https://..."
        />
      </FormField>

      <FormField
        label="URL image par défaut"
       
       
      >
        <Input
          type="url"
          defaultValue={defaultValues?.default_image_url ?? ""}
          placeholder="https://..."
        />
      </FormField>
    </div>
  );
}
