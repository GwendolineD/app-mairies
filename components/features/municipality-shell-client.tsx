"use client";

import { Suspense } from "react";
import { CreationModalProvider } from "@/components/features/creation-modal-context";
import { CreationModalHost } from "@/components/features/creation-modal-host";
import { initInitiativeEventCategories } from "@/lib/constants/initiative-categories";
import { ROUTES } from "@/lib/constants/routes";
import type {
  InitiativeEventCategoryRow,
  MembershipAddress,
} from "@/lib/types";

type Props = {
  communeId: string;
  membershipAddress: MembershipAddress;
  initiativeCategoryRows: InitiativeEventCategoryRow[];
  children: React.ReactNode;
};

export function MunicipalityShellClient({
  communeId,
  membershipAddress,
  initiativeCategoryRows,
  children,
}: Props) {
  initInitiativeEventCategories(initiativeCategoryRows);

  return (
    <CreationModalProvider>
      {children}
      <Suspense fallback={null}>
        <CreationModalHost
          communeId={communeId}
          membershipAddress={membershipAddress}
          eventIsOfficial
          eventDetailHref={ROUTES.mairie.evenementDetail}
        />
      </Suspense>
    </CreationModalProvider>
  );
}
