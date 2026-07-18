"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Maximize2 } from "lucide-react";
import { LightboxZoomableImage } from "@/components/features/lightbox-zoomable-image";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { buildOptimizedCloudinaryUrl } from "@/lib/services/cloudinary";
import { ImagePulseFrame } from "@/components/ui/image-pulse-frame";

type Props = {
  src: string;
  alt?: string;
  sizes?: string;
};

export function ImageWithLightbox({
  src,
  alt = "",
  sizes = "(max-width: 768px) 100vw, 640px",
}: Props) {
  const [open, setOpen] = useState(false);
  const thumbnailSrc = buildOptimizedCloudinaryUrl(src, { width: 1200 });
  const lightboxSrc = buildOptimizedCloudinaryUrl(src, { width: 1600 });

  useEffect(() => {
    if (!open) return;
    const preload = new window.Image();
    preload.src = lightboxSrc;
  }, [open, lightboxSrc]);

  return (
    <>
      <ImagePulseFrame
        className="aspect-[16/10] w-full overflow-hidden rounded-lg border border-border"
        resetKey={thumbnailSrc}
      >
        <Image
          src={thumbnailSrc}
          alt={alt}
          fill
          className="object-cover"
          sizes={sizes}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Agrandir l'image"
          className="absolute right-3 top-3 bg-white/80 text-text backdrop-blur-sm hover:bg-white/95"
          onClick={() => setOpen(true)}
        >
          <Maximize2 className="size-4" aria-hidden />
        </Button>
      </ImagePulseFrame>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Photo"
        size="xl"
        showCloseButton
        scrollable={false}
        className="h-[90dvh] sm:h-auto"
        contentClassName="flex h-0 min-h-0 flex-1 flex-col overflow-hidden overscroll-none p-4 sm:p-6"
      >
        <LightboxZoomableImage src={src} alt={alt} active={open} />
      </Modal>
    </>
  );
}
