import {
  buildCloudinaryFolder,
  type UploadContentType,
} from "@/lib/services/cloudinary";

const CONTENT_TYPES: UploadContentType[] = [
  "avatar",
  "announcement",
  "initiative",
  "event",
];

async function deleteCloudinaryPrefix(prefix: string): Promise<void> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn("[cloudinary-admin] Missing Cloudinary credentials, skipping cleanup");
    return;
  }

  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const url = new URL(
    `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload`,
  );
  url.searchParams.set("prefix", prefix);

  const response = await fetch(url.toString(), {
    method: "DELETE",
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("[cloudinary-admin] Failed to delete prefix", {
      prefix,
      status: response.status,
      body,
    });
  }
}

/**
 * Best-effort cleanup of all Cloudinary assets uploaded by a user.
 * Intended to be called fire-and-forget after account deletion.
 */
export async function deleteCloudinaryUserAssets(userId: string): Promise<void> {
  const uploadEnv = process.env.CLOUDINARY_UPLOAD_ENV;
  if (!uploadEnv) {
    console.warn("[cloudinary-admin] CLOUDINARY_UPLOAD_ENV not set, skipping cleanup");
    return;
  }

  await Promise.all(
    CONTENT_TYPES.map((contentType) =>
      deleteCloudinaryPrefix(buildCloudinaryFolder(uploadEnv, contentType, userId)),
    ),
  );
}
