import type { UploadContentType } from "@/lib/services/cloudinary";

export class CloudinaryUploadError extends Error {
  readonly errorType?: string;

  constructor(message: string, errorType?: string) {
    super(message);
    this.name = "CloudinaryUploadError";
    this.errorType = errorType;
  }
}

export async function uploadImageToCloudinary(
  file: File,
  contentType: UploadContentType,
): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("contentType", contentType);

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
    throw new CloudinaryUploadError(
      payload.error ?? "Échec de l'envoi de la photo.",
      payload.errorType,
    );
  }

  if (!payload.url) {
    throw new CloudinaryUploadError("Échec de l'envoi de la photo.");
  }

  return payload.url;
}
