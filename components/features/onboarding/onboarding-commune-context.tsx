"use client";

import { createContext, useContext } from "react";

const OnboardingCommuneContext = createContext<string>("votre commune");

export function OnboardingCommuneProvider({
  communeName,
  children,
}: {
  communeName: string;
  children: React.ReactNode;
}) {
  return (
    <OnboardingCommuneContext.Provider value={communeName}>
      {children}
    </OnboardingCommuneContext.Provider>
  );
}

export function useOnboardingCommuneName() {
  return useContext(OnboardingCommuneContext);
}
