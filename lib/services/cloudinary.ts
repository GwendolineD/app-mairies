export const UPLOAD_CONTENT_TYPES = ["announcement", "event", "initiative"] as const;

export type UploadContentType = (typeof UPLOAD_CONTENT_TYPES)[number];

export function isUploadContentType(value: string): value is UploadContentType {
  return (UPLOAD_CONTENT_TYPES as readonly string[]).includes(value);
}

export function buildCloudinaryFolder(
  env: string,
  contentType: UploadContentType,
  userId: string,
): string {
  return `app-mairies/${env}/${contentType}/${userId}`;
}
