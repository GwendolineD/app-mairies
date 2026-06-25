import Image from "next/image";
import { Download } from "lucide-react";
import type { CommunicationAsset } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type Props = {
  asset: CommunicationAsset;
};

export function CommunicationCard({ asset }: Props) {
  const iconButtonClass = cn(
    buttonVariants({ variant: "secondary", size: "icon-sm" }),
  );

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <div className="relative aspect-4/3 w-full bg-warm">
        <Image
          src={asset.preview_url}
          alt={asset.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 text-base font-semibold text-text">
            {asset.title}
          </h3>
          {asset.description ? (
            <p className="line-clamp-2 text-sm text-muted">{asset.description}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2">
          <a
            href={asset.file_url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className={iconButtonClass}
            aria-label={`Télécharger ${asset.title}`}
          >
            <Download className="size-4" aria-hidden />
          </a>
        </div>
      </div>
    </Card>
  );
}
