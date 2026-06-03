"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CloudUpload, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils/cn";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

type Props = {
  file: File | null;
  onFileChange: (file: File | null) => void;
  isUploading?: boolean;
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

export function ImageDropzone({ file, onFileChange, isUploading = false, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

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

  const selectFile = useCallback(
    (nextFile: File) => {
      const validationError = validateFile(nextFile);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setPreviewFromFile(nextFile);
      onFileChange(nextFile);
    },
    [onFileChange, setPreviewFromFile],
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

  if (preview) {
    return (
      <div className={cn("relative overflow-hidden rounded-xl border border-border", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={preview}
          alt=""
          className="aspect-[1.5/1] w-full object-cover object-bottom"
        />
        {isUploading ? (
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
