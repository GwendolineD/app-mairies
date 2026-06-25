"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  createCommunicationAsset,
  deleteCommunicationAsset,
  updateCommunicationAsset,
  type CommunicationAssetFormState,
} from "@/lib/actions/communication";
import type { CommunicationAsset } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { FormField, Input, Select, Textarea } from "@/components/ui/form-field";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils/cn";

type CommuneOption = {
  id: string;
  name: string;
};

type Props = {
  assets: CommunicationAsset[];
  communes: CommuneOption[];
};

const initialState: CommunicationAssetFormState = { success: false };

export function CommunicationAssetsGrid({ assets, communes }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<CommunicationAsset | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<CommunicationAsset | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden />
          <span>Ajouter un support</span>
        </Button>
      </div>

      {assets.length === 0 ? (
        <Card className="p-6 text-sm font-medium text-muted">
          Aucun support de communication configuré.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <AdminAssetCard
              key={asset.id}
              asset={asset}
              onEdit={() => setEditAsset(asset)}
              onDelete={() => setDeleteAsset(asset)}
            />
          ))}
        </div>
      )}

      {createOpen ? (
        <AssetFormModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          communes={communes}
          action={createCommunicationAsset}
          title="Ajouter un support"
          submitLabel="Créer"
        />
      ) : null}

      {editAsset ? (
        <AssetFormModal
          open={!!editAsset}
          onClose={() => setEditAsset(null)}
          communes={communes}
          asset={editAsset}
          action={updateCommunicationAsset}
          title="Modifier le support"
          submitLabel="Enregistrer"
        />
      ) : null}

      {deleteAsset ? (
        <DeleteAssetModal
          asset={deleteAsset}
          open={!!deleteAsset}
          onClose={() => setDeleteAsset(null)}
        />
      ) : null}
    </div>
  );
}

function AdminAssetCard({
  asset,
  onEdit,
  onDelete,
}: {
  asset: CommunicationAsset;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col overflow-hidden p-0">
      <div className="relative aspect-4/3 w-full bg-warm">
        <Image
          src={asset.preview_url}
          alt={asset.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
          unoptimized
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 font-semibold text-text">{asset.title}</p>
            {asset.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-muted">
                {asset.description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
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
            className={cn(
              "rounded-full px-2 py-0.5 font-semibold",
              asset.published
                ? "bg-mint/15 text-mint"
                : "bg-warm text-muted",
            )}
          >
            {asset.published ? "Publié" : "Brouillon"}
          </span>
          <span className="rounded-full bg-soft-pink px-2 py-0.5 font-semibold text-purple">
            {asset.commune?.name ?? "Toutes les communes"}
          </span>
          <span className="text-muted">Ordre : {asset.sort_order}</span>
        </div>
      </div>
    </Card>
  );
}

function AssetFormModal({
  open,
  onClose,
  communes,
  asset,
  action,
  title,
  submitLabel,
}: {
  open: boolean;
  onClose: () => void;
  communes: CommuneOption[];
  asset?: CommunicationAsset;
  action: (
    prev: CommunicationAssetFormState,
    formData: FormData,
  ) => Promise<CommunicationAssetFormState>;
  title: string;
  submitLabel: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialState);
  const [published, setPublished] = useState(asset?.published ?? true);
  const handledSuccessRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const routerRef = useRef(router);
  onCloseRef.current = onClose;
  routerRef.current = router;

  useEffect(() => {
    if (open) {
      handledSuccessRef.current = false;
      setPublished(asset?.published ?? true);
    }
  }, [open, asset]);

  useEffect(() => {
    if (!state.success || handledSuccessRef.current) {
      return;
    }
    handledSuccessRef.current = true;
    onCloseRef.current();
    routerRef.current.refresh();
  }, [state.success]);

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form action={formAction} className="space-y-4">
        {asset ? <input type="hidden" name="id" value={asset.id} /> : null}
        <input type="hidden" name="published" value={published ? "true" : "false"} />

        <FormField label="Titre" required error={state.fieldErrors?.title}>
          <Input
            name="title"
            defaultValue={asset?.title ?? ""}
            required
            maxLength={200}
          />
        </FormField>

        <FormField label="Description" error={state.fieldErrors?.description}>
          <Textarea
            name="description"
            defaultValue={asset?.description ?? ""}
            maxLength={500}
            rows={3}
          />
        </FormField>

        <FormField
          label="URL de preview"
          required
          error={state.fieldErrors?.preview_url}
        >
          <Input
            name="preview_url"
            type="url"
            defaultValue={asset?.preview_url ?? ""}
            required
            placeholder="https://..."
          />
        </FormField>

        <FormField label="URL du fichier" required error={state.fieldErrors?.file_url}>
          <Input
            name="file_url"
            type="url"
            defaultValue={asset?.file_url ?? ""}
            required
            placeholder="https://..."
          />
        </FormField>

        <FormField label="Ordre d'affichage" error={state.fieldErrors?.sort_order}>
          <Input
            name="sort_order"
            type="number"
            min={0}
            defaultValue={asset?.sort_order ?? 0}
          />
        </FormField>

        <FormField label="Commune" error={state.fieldErrors?.commune_id}>
          <Select name="commune_id" defaultValue={asset?.commune_id ?? ""}>
            <option value="">Toutes les communes</option>
            {communes.map((commune) => (
              <option key={commune.id} value={commune.id}>
                {commune.name}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="flex items-center justify-between gap-3 rounded-sm border border-border bg-warm/40 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-text">Publié</p>
            <p className="text-xs text-muted">
              Visible par les équipes mairie lorsque publié.
            </p>
          </div>
          <Switch checked={published} onCheckedChange={setPublished} />
        </div>

        {state.error && !state.fieldErrors ? (
          <p className="text-sm font-medium text-coral">{state.error}</p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={pending}>
            {pending ? "Enregistrement…" : submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteAssetModal({
  asset,
  open,
  onClose,
}: {
  asset: CommunicationAsset;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    deleteCommunicationAsset,
    initialState,
  );
  const handledSuccessRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const routerRef = useRef(router);
  onCloseRef.current = onClose;
  routerRef.current = router;

  useEffect(() => {
    if (open) {
      handledSuccessRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (!state.success || handledSuccessRef.current) {
      return;
    }
    handledSuccessRef.current = true;
    onCloseRef.current();
    routerRef.current.refresh();
  }, [state.success]);

  return (
    <Modal open={open} onClose={onClose} title="Supprimer le support">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={asset.id} />
        <p className="text-sm text-muted">
          Supprimer définitivement « {asset.title} » ?
        </p>
        {state.error ? (
          <p className="text-sm font-medium text-coral">{state.error}</p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="danger" size="sm" disabled={pending}>
            {pending ? "Suppression…" : "Supprimer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
