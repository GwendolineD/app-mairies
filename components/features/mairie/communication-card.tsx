import Image from "next/image";
import type { CommunicationAsset } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { CommunicationDownloadButton } from "@/components/features/mairie/communication-download-button";

type Props = {
  asset: CommunicationAsset;
};

export function CommunicationCard({ asset }: Props) {
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
          <CommunicationDownloadButton
            fileUrl={asset.file_url}
            title={asset.title}
          />
        </div>
      </div>
    </Card>
  );
}
