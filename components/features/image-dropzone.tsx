"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CloudUpload, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { buildOptimizedCloudinaryUrl } from "@/lib/services/cloudinary";
import { ImagePulseFrame } from "@/components/ui/image-pulse-frame";
import { compressImageForUpload } from "@/lib/services/image-compression";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
]);
const ALLOWED_EXTENSIONS = /\.(jpe?g|png|heic|heif)$/i;

type Props = {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onCompressingChange?: (compressing: boolean) => void;
  existingImageUrl?: string | null;
  onExistingImageClear?: () => void;
  isUploading?: boolean;
  className?: string;
};

function isAllowedType(file: File): boolean {
  if (ALLOWED_MIME_TYPES.has(file.type)) return true;
  // iOS Safari may report empty MIME for HEIC — fall back to extension
  if (!file.type || file.type === "application/octet-stream") {
    return ALLOWED_EXTENSIONS.test(file.name);
  }
  return false;
}

function validateFile(file: File): string | null {
  if (!isAllowedType(file)) {
    return "Ce format de fichier n'est pas pris en charge. Utilisez une photo au format JPG, PNG ou HEIC.";
  }
  if (file.size > MAX_BYTES) {
    return "Cette photo est trop volumineuse (20 Mo maximum). Essayez avec une photo plus légère.";
  }
  return null;
}

export function ImageDropzone({
  file,
  onFileChange,
  onCompressingChange,
  existingImageUrl,
  onExistingImageClear,
  isUploading = false,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const compressionIdRef = useRef(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  const setPreviewFromFile = useCallback(
    (nextFile: File | null) => {
      revokePreviewUrl();
      if (!nextFile) {
        setPreview(null);
        return;
      }
      const url = URL.createObjectURL(nextFile);
      previewUrlRef.current = url;
      setPreview(url);
    },
    [revokePreviewUrl],
  );

  useEffect(() => {
    if (!file) {
      revokePreviewUrl();
      setPreview(null);
    }
  }, [file, revokePreviewUrl]);

  useEffect(() => {
    return () => revokePreviewUrl();
  }, [revokePreviewUrl]);

  const setCompressingState = useCallback(
    (value: boolean) => {
      setCompressing(value);
      onCompressingChange?.(value);
    },
    [onCompressingChange],
  );

  const selectFile = useCallback(
    async (nextFile: File) => {
      const validationError = validateFile(nextFile);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setCompressingState(true);
      const currentId = ++compressionIdRef.current;

      try {
        const compressed = await compressImageForUpload(nextFile);
        // Another file was selected while compressing — discard this result
        if (compressionIdRef.current !== currentId) return;

        setPreviewFromFile(compressed);
        onFileChange(compressed);
      } catch {
        if (compressionIdRef.current !== currentId) return;
        setError(
          "Impossible d'optimiser cette photo. Essayez avec un autre fichier ou un format différent (JPG ou PNG).",
        );
      } finally {
        if (compressionIdRef.current === currentId) {
          setCompressingState(false);
        }
      }
    },
    [onFileChange, setPreviewFromFile, setCompressingState],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const nextFile = files?.[0];
      if (nextFile) selectFile(nextFile);
    },
    [selectFile],
  );

  const clearPhoto = () => {
    revokePreviewUrl();
    setPreview(null);
    setError(null);
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const clearExistingPhoto = () => {
    setError(null);
    onExistingImageClear?.();
  };

  const displayUrl =
    preview ??
    (existingImageUrl
      ? buildOptimizedCloudinaryUrl(existingImageUrl, { width: 800 })
      : null);

  if (compressing) {
    return (
      <div
        className={cn(
          "flex aspect-16/10 w-full items-center justify-center gap-3 rounded-lg border border-border bg-warm/40",
          className,
        )}
      >
        <Loader2 className="size-6 animate-spin text-purple" aria-hidden />
        <p className="text-sm font-medium text-muted">
          Optimisation de la photo…
        </p>
      </div>
    );
  }

  if (displayUrl) {
    return (
      <ImagePulseFrame
        className={cn(
          "aspect-16/10 w-full overflow-hidden rounded-lg border border-border",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={displayUrl} alt="" className="h-full w-full object-cover" />
        {isUploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-text/40">
            <Loader2 className="size-8 animate-spin text-white" aria-hidden />
            <p className="text-sm font-medium text-white">
              Envoi de la photo…
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={preview ? clearPhoto : clearExistingPhoto}
            className="absolute top-2 right-2 flex size-8 cursor-pointer items-center justify-center rounded-full bg-surface/90 text-text shadow-card transition hover:bg-surface"
            aria-label="Retirer la photo"
          >
            <X className="size-4" />
          </button>
        )}
      </ImagePulseFrame>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition",
          dragOver
            ? "border-purple bg-soft-pink/50"
            : "border-border bg-warm/30 hover:border-purple/40 hover:bg-warm/60",
        )}
      >
        <CloudUpload className="size-10 text-muted" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-text">
            Ajouter une photo (optionnel)
          </p>
          <p className="mt-1 text-xs font-medium text-muted">
            Glissez-déposez une image ici ou cliquez pour parcourir
          </p>
          <p className="mt-0.5 text-xs text-subtle">
            JPG, PNG ou HEIC — Max. 20 Mo
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error ? (
        <p className="mt-2 text-sm font-medium text-coral" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
