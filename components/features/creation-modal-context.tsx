"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AnnouncementType } from "@/lib/constants/announcement-types";

type OpenAnnouncementOptions = {
  presetType?: AnnouncementType;
};

type CreationModalContextValue = {
  openAnnouncementModal: (options?: OpenAnnouncementOptions) => void;
  openInitiativeModal: () => void;
  closeModals: () => void;
  announcementOpen: boolean;
  initiativeOpen: boolean;
  announcementPresetType: AnnouncementType;
};

const CreationModalContext = createContext<CreationModalContextValue | null>(
  null,
);

export function CreationModalProvider({ children }: { children: ReactNode }) {
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [initiativeOpen, setInitiativeOpen] = useState(false);
  const [announcementPresetType, setAnnouncementPresetType] =
    useState<AnnouncementType>("demande");

  const openAnnouncementModal = useCallback(
    (options?: OpenAnnouncementOptions) => {
      setAnnouncementPresetType(options?.presetType ?? "demande");
      setInitiativeOpen(false);
      setAnnouncementOpen(true);
    },
    [],
  );

  const openInitiativeModal = useCallback(() => {
    setAnnouncementOpen(false);
    setInitiativeOpen(true);
  }, []);

  const closeModals = useCallback(() => {
    setAnnouncementOpen(false);
    setInitiativeOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      openAnnouncementModal,
      openInitiativeModal,
      closeModals,
      announcementOpen,
      initiativeOpen,
      announcementPresetType,
    }),
    [
      openAnnouncementModal,
      openInitiativeModal,
      closeModals,
      announcementOpen,
      initiativeOpen,
      announcementPresetType,
    ],
  );

  return (
    <CreationModalContext.Provider value={value}>
      {children}
    </CreationModalContext.Provider>
  );
}

export function useCreationModals() {
  const ctx = useContext(CreationModalContext);
  if (!ctx) {
    throw new Error("useCreationModals must be used within CreationModalProvider");
  }
  return ctx;
}
