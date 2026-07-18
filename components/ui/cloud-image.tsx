"use client";

import Image from "next/image";
import { buildOptimizedCloudinaryUrl } from "@/lib/services/cloudinary";
import { cn } from "@/lib/utils/cn";
import { ImagePulseFrame } from "@/components/ui/image-pulse-frame";

type CloudImageProps = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  /** Max delivery width for Cloudinary transforms (default: card thumbnails). */
  deliveryWidth?: number;
};

export function CloudImage({
  src,
  alt,
  className,
  fill = true,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  deliveryWidth = 800,
  ...props
}: CloudImageProps) {
  const optimizedSrc = buildOptimizedCloudinaryUrl(src, { width: deliveryWidth });

  const image = (
    <Image
      src={optimizedSrc}
      alt={alt}
      className={cn("object-cover", className)}
      fill={fill}
      sizes={sizes}
      priority={priority}
      {...props}
    />
  );

  if (fill) {
    return (
      <ImagePulseFrame className="size-full" resetKey={optimizedSrc}>
        {image}
      </ImagePulseFrame>
    );
  }

  return image;
}
