"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CloudUpload, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils/cn";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  communeId: string;
  className?: string;
};

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Format non autorisé (JPG ou PNG uniquement).";
  }
  if (file.size > MAX_BYTES) {
    return "Fichier trop volumineux (5 Mo max).";
  }
  return null;
}

export function ImageDropzone({ value, onChange, communeId, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value);

  useEffect(() => {
    setPreview(value);
  }, [value]);

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setUploading(true);

      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);

      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("contentType", "announcement");
        fd.append("contentId", communeId);

        const res = await fetch("/api/uploads/cloudinary", {
          method: "POST",
          body: fd,
        });

        const payload = (await res.json()) as {
          url?: string;
          error?: string;
          errorType?: string;
        };

        if (!res.ok) {
          setPreview(value);
          URL.revokeObjectURL(localPreview);
          if (payload.errorType === "virus_detected") {
            setError("Ce fichier a été rejeté pour des raisons de sécurité.");
          } else if (payload.errorType === "service_unavailable") {
            setError("Service de sécurité indisponible. Réessayez plus tard.");
          } else {
            setError(payload.error ?? "Échec de l'envoi de la photo.");
          }
          return;
        }

        URL.revokeObjectURL(localPreview);
        const url = payload.url ?? null;
        setPreview(url);
        onChange(url);
      } catch {
        setPreview(value);
        URL.revokeObjectURL(localPreview);
        setError("Échec de l'envoi de la photo.");
      } finally {
        setUploading(false);
      }
    },
    [communeId, onChange, value],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) void uploadFile(file);
    },
    [uploadFile],
  );

  const clearPhoto = () => {
    setPreview(null);
    setError(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (preview) {
    return (
      <div className={cn("relative overflow-hidden rounded-xl border border-border", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="" className="aspect-video w-full object-cover" />
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-text/40">
            <Loader2 className="size-8 animate-spin text-white" aria-hidden />
          </div>
        ) : (
          <button
            type="button"
            onClick={clearPhoto}
            className="absolute top-2 right-2 flex size-8 cursor-pointer items-center justify-center rounded-full bg-surface/90 text-text shadow-card transition hover:bg-surface"
            aria-label="Retirer la photo"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
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
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition",
          dragOver
            ? "border-purple bg-soft-pink/50"
            : "border-border bg-warm/30 hover:border-purple/40 hover:bg-warm/60",
          uploading && "pointer-events-none opacity-70",
        )}
      >
        {uploading ? (
          <Loader2 className="size-10 animate-spin text-purple" aria-hidden />
        ) : (
          <CloudUpload className="size-10 text-muted" aria-hidden />
        )}
        <div>
          <p className="text-sm font-semibold text-text">
            Ajouter une photo (optionnel)
          </p>
          <p className="mt-1 text-xs font-medium text-muted">
            Glissez-déposez une image ici ou cliquez pour parcourir
          </p>
          <p className="mt-0.5 text-xs text-subtle">JPG, PNG — Max. 5 Mo</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,.jpg,.jpeg,.png"
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
