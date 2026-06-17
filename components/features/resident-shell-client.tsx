"use client";

import { Suspense } from "react";
import { CreationModalProvider } from "@/components/features/creation-modal-context";
import { CreationModalHost } from "@/components/features/creation-modal-host";
import { initCategories } from "@/lib/constants/announcement-categories";
import { initInitiativeEventCategories } from "@/lib/constants/initiative-categories";
import type {
  AnnouncementCategoryRow,
  InitiativeEventCategoryRow,
  MembershipAddress,
} from "@/lib/types";

type Props = {
  communeId: string;
  membershipAddress: MembershipAddress;
  announcementCategoryRows: AnnouncementCategoryRow[];
  initiativeCategoryRows: InitiativeEventCategoryRow[];
  children: React.ReactNode;
};

export function ResidentShellClient({
  communeId,
  membershipAddress,
  announcementCategoryRows,
  initiativeCategoryRows,
  children,
}: Props) {
  // Server layouts init these caches for RSC; client components need the same
  // DB rows synced here because module state is not shared across the boundary.
  initCategories(announcementCategoryRows);
  initInitiativeEventCategories(initiativeCategoryRows);

  return (
    <CreationModalProvider>
      {children}
      <Suspense fallback={null}>
        <CreationModalHost
          communeId={communeId}
          membershipAddress={membershipAddress}
        />
      </Suspense>
    </CreationModalProvider>
  );
}
