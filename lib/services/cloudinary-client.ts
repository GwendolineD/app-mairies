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
  publicId?: string,
): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("contentType", contentType);
  if (publicId) fd.append("publicId", publicId);

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
      payload.error ?? "L'envoi de la photo a échoué. Vérifiez votre connexion et réessayez.",
      payload.errorType,
    );
  }

  if (!payload.url) {
    throw new CloudinaryUploadError("L'envoi de la photo a échoué. Vérifiez votre connexion et réessayez.");
  }

  return payload.url;
}
