"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  buildCommunicationAssetDownloadUrl,
  isCloudinaryDeliveryUrl,
  sanitizeCloudinaryAttachmentFilename,
} from "@/lib/services/cloudinary";
import { cn } from "@/lib/utils/cn";

type Props = {
  fileUrl: string;
  title: string;
};

function filenameFromContentDisposition(
  header: string | null,
  fallback: string,
): string {
  const match = header?.match(/filename="([^"]+)"/i);
  return match?.[1] ?? fallback;
}

async function downloadViaBlob(url: string, fallbackFilename: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Download failed");
  }

  const filename = filenameFromContentDisposition(
    response.headers.get("content-disposition"),
    fallbackFilename,
  );
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
}

export function CommunicationDownloadButton({ fileUrl, title }: Props) {
  const [loading, setLoading] = useState(false);
  const iconButtonClass = cn(
    buttonVariants({ variant: "secondary", size: "icon-sm" }),
  );

  const isCloudinary = isCloudinaryDeliveryUrl(fileUrl);
  const downloadUrl = buildCommunicationAssetDownloadUrl(fileUrl, title);
  const fallbackFilename = `${sanitizeCloudinaryAttachmentFilename(title)}.png`;

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (isCloudinary) {
        await downloadViaBlob(downloadUrl, fallbackFilename);
        return;
      }

      const anchor = document.createElement("a");
      anchor.href = fileUrl;
      anchor.download = fallbackFilename;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      window.location.assign(isCloudinary ? downloadUrl : fileUrl);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={iconButtonClass}
      aria-label={`Télécharger ${title}`}
      aria-busy={loading}
      disabled={loading}
      onClick={() => void handleClick()}
    >
      <Download className="size-4" aria-hidden />
    </button>
  );
}
