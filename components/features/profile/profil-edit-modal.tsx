"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "@/lib/actions/profile";
import {
  CloudinaryUploadError,
  uploadImageToCloudinary,
} from "@/lib/services/cloudinary-client";
import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";

type Props = {
  open: boolean;
  onClose: () => void;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  firstName: string | null;
  lastName: string | null;
};

function slugifyName(first: string | null, last: string | null) {
  return [first, last]
    .filter(Boolean)
    .join("-")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 60);
}

export function ProfilEditModal({
  open,
  onClose,
  displayName,
  bio,
  avatarUrl,
  firstName,
  lastName,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(displayName);
  const [bioText, setBioText] = useState(bio);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setPreview(URL.createObjectURL(file));
      setUploading(true);
      try {
        const publicId = slugifyName(firstName, lastName) || undefined;
        const url = await uploadImageToCloudinary(file, "avatar", publicId);
        setPendingAvatarUrl(url);
        setPreview(url);
      } catch (err) {
        const msg =
          err instanceof CloudinaryUploadError
            ? err.message
            : "Erreur lors de l'upload de la photo.";
        toast.error(msg);
        setPreview(avatarUrl);
        setPendingAvatarUrl(null);
      } finally {
        setUploading(false);
      }
    },
    [avatarUrl, firstName, lastName],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateProfile({
        displayName: name,
        bio: bioText || undefined,
        avatarUrl: pendingAvatarUrl ?? avatarUrl ?? "",
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Profil mis à jour !");
      router.refresh();
      onClose();
    });
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Éditer mon profil"
      showCloseButton
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            form="profil-edit-form"
            size="sm"
            disabled={isPending || uploading}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Enregistrer
          </Button>
        </div>
      }
    >
      <form
        id="profil-edit-form"
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-border bg-soft-pink text-2xl font-bold text-purple shadow-card transition hover:border-purple/40"
          >
            {preview ? (
              <Image
                src={preview}
                alt=""
                width={96}
                height={96}
                unoptimized
                className="size-full object-cover"
              />
            ) : (
              initials
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-text/40 opacity-0 transition group-hover:opacity-100">
              {uploading ? (
                <Loader2 className="size-5 animate-spin text-white" />
              ) : (
                <Camera className="size-5 text-white" />
              )}
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="text-xs text-muted">
            Cliquez pour changer votre photo (JPG/PNG, 5 Mo max)
          </p>
        </div>

        <FormField label="Nom affiché">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
        </FormField>

        <FormField label="Bio">
          <Textarea
            value={bioText}
            onChange={(e) => setBioText(e.target.value)}
            rows={4}
            placeholder="Parlez de vous en quelques mots..."
          />
        </FormField>
      </form>
    </Modal>
  );
}
