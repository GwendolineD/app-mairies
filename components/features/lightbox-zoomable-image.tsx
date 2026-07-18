"use client";

import { useEffect, useRef } from "react";
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";

type Props = {
  src: string;
  alt?: string;
  active: boolean;
};

export function LightboxZoomableImage({ src, alt = "", active }: Props) {
  const ref = useRef<ReactZoomPanPinchRef>(null);

  useEffect(() => {
    if (!active) ref.current?.resetTransform();
  }, [active]);

  return (
    <div className="h-full min-h-0 w-full">
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
          wrapperClass="!w-full !h-full"
          contentClass="!w-full !h-full flex items-center justify-center"
        >
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="max-h-full max-w-full touch-none object-contain"
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
