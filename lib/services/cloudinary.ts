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
