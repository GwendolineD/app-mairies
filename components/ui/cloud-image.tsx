import Image from "next/image";
import { cn } from "@/lib/utils/cn";

type CloudImageProps = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
};

export function CloudImage({
  src,
  alt,
  className,
  fill = true,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  ...props
}: CloudImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      className={cn("object-cover", className)}
      fill={fill}
      sizes={sizes}
      priority={priority}
      {...props}
    />
  );
}
