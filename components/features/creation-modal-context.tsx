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
import type { AnnouncementEditData, InitiativeEditData } from "@/lib/types";

type OpenAnnouncementOptions = {
  presetType?: AnnouncementType;
  editId?: string;
  initialData?: AnnouncementEditData;
};

type OpenInitiativeOptions = {
  editId?: string;
  initialData?: InitiativeEditData;
};

type CreationModalContextValue = {
  openAnnouncementModal: (options?: OpenAnnouncementOptions) => void;
  openInitiativeModal: (options?: OpenInitiativeOptions) => void;
  closeModals: () => void;
  announcementOpen: boolean;
  initiativeOpen: boolean;
  announcementPresetType: AnnouncementType;
  announcementEditId: string | undefined;
  announcementInitialData: AnnouncementEditData | undefined;
  initiativeEditId: string | undefined;
  initiativeInitialData: InitiativeEditData | undefined;
};

const CreationModalContext = createContext<CreationModalContextValue | null>(
  null,
);

export function CreationModalProvider({ children }: { children: ReactNode }) {
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [initiativeOpen, setInitiativeOpen] = useState(false);
  const [announcementPresetType, setAnnouncementPresetType] =
    useState<AnnouncementType>("demande");
  const [announcementEditId, setAnnouncementEditId] = useState<string | undefined>();
  const [announcementInitialData, setAnnouncementInitialData] = useState<AnnouncementEditData | undefined>();
  const [initiativeEditId, setInitiativeEditId] = useState<string | undefined>();
  const [initiativeInitialData, setInitiativeInitialData] = useState<InitiativeEditData | undefined>();

  const openAnnouncementModal = useCallback(
    (options?: OpenAnnouncementOptions) => {
      setAnnouncementPresetType(options?.presetType ?? "demande");
      setAnnouncementEditId(options?.editId);
      setAnnouncementInitialData(options?.initialData);
      setInitiativeOpen(false);
      setInitiativeEditId(undefined);
      setInitiativeInitialData(undefined);
      setAnnouncementOpen(true);
    },
    [],
  );

  const openInitiativeModal = useCallback((options?: OpenInitiativeOptions) => {
    setAnnouncementOpen(false);
    setAnnouncementEditId(undefined);
    setAnnouncementInitialData(undefined);
    setInitiativeEditId(options?.editId);
    setInitiativeInitialData(options?.initialData);
    setInitiativeOpen(true);
  }, []);

  const closeModals = useCallback(() => {
    setAnnouncementOpen(false);
    setInitiativeOpen(false);
    setAnnouncementEditId(undefined);
    setAnnouncementInitialData(undefined);
    setInitiativeEditId(undefined);
    setInitiativeInitialData(undefined);
  }, []);

  const value = useMemo(
    () => ({
      openAnnouncementModal,
      openInitiativeModal,
      closeModals,
      announcementOpen,
      initiativeOpen,
      announcementPresetType,
      announcementEditId,
      announcementInitialData,
      initiativeEditId,
      initiativeInitialData,
    }),
    [
      openAnnouncementModal,
      openInitiativeModal,
      closeModals,
      announcementOpen,
      initiativeOpen,
      announcementPresetType,
      announcementEditId,
      announcementInitialData,
      initiativeEditId,
      initiativeInitialData,
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
