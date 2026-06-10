"use client";

import { Suspense } from "react";
import { CreationModalProvider } from "@/components/features/creation-modal-context";
import { CreationModalHost } from "@/components/features/creation-modal-host";

type Props = {
  communeId: string;
  children: React.ReactNode;
};

export function ResidentShellClient({ communeId, children }: Props) {
  return (
    <CreationModalProvider>
      {children}
      <Suspense fallback={null}>
        <CreationModalHost communeId={communeId} />
      </Suspense>
    </CreationModalProvider>
  );
}
