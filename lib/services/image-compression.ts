import imageCompression from "browser-image-compression";

const HEIC_MIME_TYPES = new Set(["image/heic", "image/heif"]);
const HEIC_EXTENSIONS = /\.heic$/i;

function isHeicFile(file: File): boolean {
  if (HEIC_MIME_TYPES.has(file.type)) return true;
  if (!file.type || file.type === "application/octet-stream") {
    return HEIC_EXTENSIONS.test(file.name);
  }
  return false;
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const { default: heic2any } = await import("heic2any");
  const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  const result = blob instanceof Blob ? blob : blob[0];
  const name = file.name.replace(/\.heic$/i, ".jpg");
  return new File([result], name, { type: "image/jpeg" });
}

/**
 * Compress and resize an image for upload.
 * - HEIC/HEIF files are converted to JPEG first (heic2any loaded on demand).
 * - All images are resized to max 2048px and compressed to ~2 Mo JPEG.
 * - PNG transparency is flattened to white background (desired behavior).
 */
export async function compressImageForUpload(file: File): Promise<File> {
  let input: File = file;

  if (isHeicFile(file)) {
    input = await convertHeicToJpeg(file);
  }

  return imageCompression(input, {
    maxSizeMB: 2,
    maxWidthOrHeight: 2048,
    useWebWorker: true,
    fileType: "image/jpeg",
  });
}
