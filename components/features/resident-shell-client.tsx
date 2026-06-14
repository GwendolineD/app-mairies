"use client";

import { Suspense } from "react";
import { CreationModalProvider } from "@/components/features/creation-modal-context";
import { CreationModalHost } from "@/components/features/creation-modal-host";
import type { MembershipAddress } from "@/lib/types";

type Props = {
  communeId: string;
  membershipAddress: MembershipAddress;
  children: React.ReactNode;
};

export function ResidentShellClient({
  communeId,
  membershipAddress,
  children,
}: Props) {
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
