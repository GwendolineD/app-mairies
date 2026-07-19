"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import { buildOptimizedCloudinaryUrl } from "@/lib/services/cloudinary";
import { cn } from "@/lib/utils/cn";

type Props = {
  src: string;
  alt?: string;
  active: boolean;
};

export function LightboxZoomableImage({ src, alt = "", active }: Props) {
  const ref = useRef<ReactZoomPanPinchRef>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const optimizedSrc = buildOptimizedCloudinaryUrl(src, { width: 1600 });

  useEffect(() => {
    if (!active) {
      ref.current?.resetTransform();
      setLoaded(false);
      return;
    }

    setLoaded(false);
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [active, optimizedSrc]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  return (
    <div className="relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden">
      {!loaded ? (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-warm animate-pulse"
          aria-hidden={loaded}
        >
          <Loader2 className="size-8 animate-spin text-muted" />
          <span className="sr-only">Chargement de l&apos;image…</span>
        </div>
      ) : null}

      <TransformWrapper
        ref={ref}
        initialScale={1}
        minScale={1}
        maxScale={4}
        centerOnInit
        limitToBounds
        doubleClick={{ mode: "toggle", step: 2 }}
        wheel={{ step: 0.1 }}
        pinch={{ step: 5 }}
      >
        <TransformComponent
          wrapperClass="!size-full !max-h-full !max-w-full"
          contentClass="!flex !size-full !max-h-full !max-w-full items-center justify-center"
          wrapperStyle={{ width: "100%", height: "100%", maxHeight: "100%" }}
          contentStyle={{
            width: "100%",
            height: "100%",
            maxHeight: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            ref={imgRef}
            src={optimizedSrc}
            alt={alt}
            draggable={false}
            onLoad={handleLoad}
            className={cn(
              "max-h-full max-w-full touch-none object-contain transition-opacity duration-200",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
