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
import type { AnnouncementEditData, InitiativeEditData, EventEditData } from "@/lib/types";

type OpenAnnouncementOptions = {
  presetType?: AnnouncementType;
  editId?: string;
  initialData?: AnnouncementEditData;
};

type OpenInitiativeOptions = {
  editId?: string;
  initialData?: InitiativeEditData;
};

type OpenEventOptions = {
  editId?: string;
  initialData?: EventEditData;
  duplicateMode?: boolean;
};

type CreationModalContextValue = {
  openAnnouncementModal: (options?: OpenAnnouncementOptions) => void;
  openInitiativeModal: (options?: OpenInitiativeOptions) => void;
  openEventModal: (options?: OpenEventOptions) => void;
  closeModals: () => void;
  announcementOpen: boolean;
  initiativeOpen: boolean;
  eventOpen: boolean;
  announcementPresetType: AnnouncementType;
  announcementEditId: string | undefined;
  announcementInitialData: AnnouncementEditData | undefined;
  initiativeEditId: string | undefined;
  initiativeInitialData: InitiativeEditData | undefined;
  eventEditId: string | undefined;
  eventInitialData: EventEditData | undefined;
  eventDuplicateMode: boolean;
};

const CreationModalContext = createContext<CreationModalContextValue | null>(
  null,
);

export function CreationModalProvider({ children }: { children: ReactNode }) {
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [initiativeOpen, setInitiativeOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [announcementPresetType, setAnnouncementPresetType] =
    useState<AnnouncementType>("demande");
  const [announcementEditId, setAnnouncementEditId] = useState<string | undefined>();
  const [announcementInitialData, setAnnouncementInitialData] = useState<AnnouncementEditData | undefined>();
  const [initiativeEditId, setInitiativeEditId] = useState<string | undefined>();
  const [initiativeInitialData, setInitiativeInitialData] = useState<InitiativeEditData | undefined>();
  const [eventEditId, setEventEditId] = useState<string | undefined>();
  const [eventInitialData, setEventInitialData] = useState<EventEditData | undefined>();
  const [eventDuplicateMode, setEventDuplicateMode] = useState(false);

  const closeAllExceptAnnouncement = useCallback(() => {
    setInitiativeOpen(false);
    setInitiativeEditId(undefined);
    setInitiativeInitialData(undefined);
    setEventOpen(false);
    setEventEditId(undefined);
    setEventInitialData(undefined);
    setEventDuplicateMode(false);
  }, []);

  const closeAllExceptInitiative = useCallback(() => {
    setAnnouncementOpen(false);
    setAnnouncementEditId(undefined);
    setAnnouncementInitialData(undefined);
    setEventOpen(false);
    setEventEditId(undefined);
    setEventInitialData(undefined);
    setEventDuplicateMode(false);
  }, []);

  const closeAllExceptEvent = useCallback(() => {
    setAnnouncementOpen(false);
    setAnnouncementEditId(undefined);
    setAnnouncementInitialData(undefined);
    setInitiativeOpen(false);
    setInitiativeEditId(undefined);
    setInitiativeInitialData(undefined);
  }, []);

  const openAnnouncementModal = useCallback(
    (options?: OpenAnnouncementOptions) => {
      closeAllExceptAnnouncement();
      setAnnouncementPresetType(options?.presetType ?? "demande");
      setAnnouncementEditId(options?.editId);
      setAnnouncementInitialData(options?.initialData);
      setAnnouncementOpen(true);
    },
    [closeAllExceptAnnouncement],
  );

  const openInitiativeModal = useCallback((options?: OpenInitiativeOptions) => {
    closeAllExceptInitiative();
    setInitiativeEditId(options?.editId);
    setInitiativeInitialData(options?.initialData);
    setInitiativeOpen(true);
  }, [closeAllExceptInitiative]);

  const openEventModal = useCallback((options?: OpenEventOptions) => {
    closeAllExceptEvent();
    setEventEditId(options?.editId);
    setEventInitialData(options?.initialData);
    setEventDuplicateMode(options?.duplicateMode ?? false);
    setEventOpen(true);
  }, [closeAllExceptEvent]);

  const closeModals = useCallback(() => {
    setAnnouncementOpen(false);
    setInitiativeOpen(false);
    setEventOpen(false);
    setAnnouncementEditId(undefined);
    setAnnouncementInitialData(undefined);
    setInitiativeEditId(undefined);
    setInitiativeInitialData(undefined);
    setEventEditId(undefined);
    setEventInitialData(undefined);
    setEventDuplicateMode(false);
  }, []);

  const value = useMemo(
    () => ({
      openAnnouncementModal,
      openInitiativeModal,
      openEventModal,
      closeModals,
      announcementOpen,
      initiativeOpen,
      eventOpen,
      announcementPresetType,
      announcementEditId,
      announcementInitialData,
      initiativeEditId,
      initiativeInitialData,
      eventEditId,
      eventInitialData,
      eventDuplicateMode,
    }),
    [
      openAnnouncementModal,
      openInitiativeModal,
      openEventModal,
      closeModals,
      announcementOpen,
      initiativeOpen,
      eventOpen,
      announcementPresetType,
      announcementEditId,
      announcementInitialData,
      initiativeEditId,
      initiativeInitialData,
      eventEditId,
      eventInitialData,
      eventDuplicateMode,
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
