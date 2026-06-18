"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { CommuneAccessStatusControl } from "@/components/features/backoffice/commune-access-status-control";
import { EditCommuneInfoModal } from "@/components/features/backoffice/edit-commune-info-modal";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/page-heading";
import { formatShortDate } from "@/lib/utils/format-date";
import type { AccessStatus } from "@/lib/types";

type Props = {
  name: string;
  postcode: string | null;
  inseeCode: string;
  createdAt: string;
  communeId: string;
  accessStatus: AccessStatus;
  mairieAddressStreet: string | null;
  mairieAddressCity: string | null;
  mairieAddressPostcode: string | null;
  mairieAddressLat: number | null;
  mairieAddressLng: number | null;
};

export function CommuneDetailHeader({
  name,
  postcode,
  inseeCode,
  createdAt,
  communeId,
  accessStatus,
  mairieAddressStreet,
  mairieAddressCity,
  mairieAddressPostcode,
  mairieAddressLat,
  mairieAddressLng,
}: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const title = postcode ? `${name} (${postcode})` : name;

  return (
    <>
      <div className="space-y-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <PageHeading title={title} className="min-w-0 flex-1" />
            {mairieAddressStreet ? (
              <p className="text-sm font-medium text-muted">{mairieAddressStreet}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              aria-label="Modifier la commune"
              className="cursor-pointer"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-4" aria-hidden />
            </Button>
            <CommuneAccessStatusControl
              communeId={communeId}
              currentStatus={accessStatus}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-muted">
          <p>créé le {formatShortDate(createdAt)}</p>
          <p>INSEE {inseeCode}</p>
        </div>
      </div>

      <EditCommuneInfoModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        communeId={communeId}
        inseeCode={inseeCode}
        initialName={name}
        initialPostcode={postcode ?? ""}
        initialMairieAddressStreet={mairieAddressStreet ?? ""}
        initialMairieAddressCity={mairieAddressCity ?? name}
        initialMairieAddressPostcode={mairieAddressPostcode ?? postcode ?? ""}
        initialMairieAddressLat={mairieAddressLat}
        initialMairieAddressLng={mairieAddressLng}
      />
    </>
  );
}
