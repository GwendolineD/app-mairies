export const UPLOAD_CONTENT_TYPES = ["announcement", "event", "initiative", "avatar"] as const;

export type UploadContentType = (typeof UPLOAD_CONTENT_TYPES)[number];

export function isUploadContentType(value: string): value is UploadContentType {
  return (UPLOAD_CONTENT_TYPES as readonly string[]).includes(value);
}

export const AVATAR_PUBLIC_ID = "avatar";

export function buildCloudinaryFolder(
  env: string,
  contentType: UploadContentType,
  userId: string,
): string {
  if (contentType === "avatar") {
    return `app-mairies/${env}/avatars/${userId}`;
  }
  return `app-mairies/${env}/${contentType}/${userId}`;
}

const CLOUDINARY_DELIVERY_HOST = "res.cloudinary.com";

export function isCloudinaryDeliveryUrl(url: string): boolean {
  try {
    return new URL(url).hostname === CLOUDINARY_DELIVERY_HOST;
  } catch {
    return false;
  }
}

/** Safe basename for Cloudinary fl_attachment:flag (no extension — Cloudinary adds it). */
export function sanitizeCloudinaryAttachmentFilename(title: string): string {
  return (
    title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 100) || "download"
  );
}

/** Forces browser download via Cloudinary Content-Disposition: attachment. */
export function buildCloudinaryAttachmentUrl(
  url: string,
  filename?: string,
): string {
  if (!isCloudinaryDeliveryUrl(url) || url.includes("fl_attachment")) {
    return url;
  }

  const uploadMarker = "/upload/";
  const markerIndex = url.indexOf(uploadMarker);
  if (markerIndex === -1) {
    return url;
  }

  const prefix = url.slice(0, markerIndex + uploadMarker.length);
  const suffix = url.slice(markerIndex + uploadMarker.length);
  const flag = filename ? `fl_attachment:${filename}` : "fl_attachment";

  return `${prefix}${flag}/${suffix}`;
}

export function buildCommunicationAssetDownloadUrl(
  fileUrl: string,
  title: string,
): string {
  if (!isCloudinaryDeliveryUrl(fileUrl)) {
    return fileUrl;
  }

  return buildCloudinaryAttachmentUrl(
    fileUrl,
    sanitizeCloudinaryAttachmentFilename(title),
  );
}
