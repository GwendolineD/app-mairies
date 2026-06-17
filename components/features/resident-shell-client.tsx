"use client";

import { Suspense } from "react";
import { CreationModalProvider } from "@/components/features/creation-modal-context";
import { CreationModalHost } from "@/components/features/creation-modal-host";
import { OnboardingModalHost } from "@/components/features/onboarding/onboarding-modal-host";
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
  hasSeenOnboarding: boolean;
  communeName: string;
  children: React.ReactNode;
};

export function ResidentShellClient({
  communeId,
  membershipAddress,
  announcementCategoryRows,
  initiativeCategoryRows,
  hasSeenOnboarding,
  communeName,
  children,
}: Props) {
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
      <OnboardingModalHost
        hasSeenOnboarding={hasSeenOnboarding}
        communeName={communeName}
      />
    </CreationModalProvider>
  );
}
