"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRandomErrorIllustration } from "@/lib/actions/platform-settings";
import { isCloudinaryDeliveryUrl } from "@/lib/services/cloudinary";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CloudImage } from "@/components/ui/cloud-image";
import { cn } from "@/lib/utils/cn";

type Props = {
  title: string;
  description: string;
  homeHref: string;
  homeLabel: string;
  onRetry: () => void;
  /** Use plain div instead of Card (global error boundary). */
  variant?: "card" | "plain";
  className?: string;
  retryButtonSize?: "default" | "sm";
};

export function ErrorBoundaryCard({
  title,
  description,
  homeHref,
  homeLabel,
  onRetry,
  variant = "card",
  className,
  retryButtonSize = "sm",
}: Props) {
  const [illustrationUrl, setIllustrationUrl] = useState<string | null>(null);
  const [illustrationLoaded, setIllustrationLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getRandomErrorIllustration()
      .then((url) => {
        if (!cancelled) setIllustrationUrl(url);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIllustrationLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const showIllustrationSlot = !illustrationLoaded || illustrationUrl !== null;

  const body = (
    <>
      {showIllustrationSlot ? (
        <div
          className={cn(
            "relative mx-auto aspect-4/3 min-h-32 w-full max-w-xs overflow-hidden rounded-2xl bg-warm",
            illustrationLoaded && !illustrationUrl && "invisible",
          )}
          aria-hidden={illustrationLoaded && !illustrationUrl}
        >
          {illustrationUrl && isCloudinaryDeliveryUrl(illustrationUrl) ? (
            <CloudImage
              src={illustrationUrl}
              alt=""
              fill
              sizes="320px"
              className="object-contain"
            />
          ) : null}
        </div>
      ) : null}
      <h2
        className={cn(
          "font-semibold text-text",
          variant === "plain" ? "text-2xl font-bold" : "text-xl",
        )}
      >
        {title}
      </h2>
      <p className={cn("text-muted", variant === "plain" ? "text-base" : "text-sm")}>
        {description}
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          href={homeHref}
          className="inline-flex items-center justify-center rounded-sm border border-border bg-surface px-4 py-1.5 text-sm font-medium text-text hover:bg-warm"
        >
          {homeLabel}
        </Link>
        <Button variant="primary" size={retryButtonSize} onClick={onRetry}>
          Réessayer
        </Button>
      </div>
    </>
  );

  if (variant === "plain") {
    return (
      <div className={cn("w-full max-w-md space-y-4 text-center", className)}>
        {body}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-1 items-center justify-center p-6", className)}>
      <Card className="w-full max-w-md space-y-4 p-8 text-center">{body}</Card>
    </div>
  );
}
