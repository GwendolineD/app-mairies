"use client";

import { useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isAnnouncementType, type AnnouncementType } from "@/lib/constants/announcement-types";
import { ROUTES } from "@/lib/constants/routes";
import { buildAnnouncementListQuery, buildEventListQuery, buildInitiativeListQuery } from "@/lib/utils/search-params";
import { CreateAnnouncementModal } from "@/components/features/create-announcement-modal";
import { CreateInitiativeModal } from "@/components/features/create-initiative-modal";
import { CreateEventModal } from "@/components/features/create-event-modal";
import { useCreationModals } from "@/components/features/creation-modal-context";
import type { MembershipAddress } from "@/lib/types";

type Props = {
  communeId: string;
  membershipAddress: MembershipAddress;
  eventIsOfficial?: boolean;
  eventDetailHref?: (id: string) => string;
};

export function CreationModalHost({
  communeId,
  membershipAddress,
  eventIsOfficial = false,
  eventDetailHref = ROUTES.evenements.detail,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
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
    openAnnouncementModal,
    openInitiativeModal,
    openEventModal,
    closeModals,
  } = useCreationModals();

  const stripCreateFromUrl = useCallback(() => {
    const create = searchParams.get("create");
    if (!create) return;
    const catParam = searchParams.get("cat") ?? searchParams.get("categorie");
    const vue = searchParams.get("vue") === "carte" ? "carte" : "liste";
    const page = Number.parseInt(searchParams.get("page") ?? "1", 10) || 1;

    if (create === "event") {
      const next = buildEventListQuery({ vue, page, categorie: catParam || undefined });
      router.replace(`${ROUTES.evenements.list}${next}`);
      return;
    }

    if (create === "initiative") {
      const next = buildInitiativeListQuery({ vue, page, categorie: catParam || undefined });
      router.replace(`${ROUTES.initiatives.list}${next}`);
      return;
    }

    const next = buildAnnouncementListQuery({
      vue,
      type: isAnnouncementType(searchParams.get("type") ?? "")
        ? (searchParams.get("type") as "demande" | "offre")
        : undefined,
      categories: catParam
        ? catParam.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      page,
    });
    router.replace(`${ROUTES.annonces.list}${next}`);
  }, [router, searchParams]);

  const handleClose = useCallback(() => {
    closeModals();
    stripCreateFromUrl();
  }, [closeModals, stripCreateFromUrl]);

  const handleInitiativeCreated = useCallback(
    (id: string) => {
      router.push(ROUTES.initiatives.detail(id));
      closeModals();
    },
    [closeModals, router],
  );

  const handleEventCreated = useCallback(
    (id: string) => {
      router.push(eventDetailHref(id));
      closeModals();
    },
    [closeModals, eventDetailHref, router],
  );

  useEffect(() => {
    const create = searchParams.get("create");
    if (create === "annonce") {
      const typeParam = searchParams.get("type") ?? searchParams.get("createType") ?? "";
      const preset: AnnouncementType = isAnnouncementType(typeParam) ? typeParam : "demande";
      openAnnouncementModal({ presetType: preset });
    } else if (create === "initiative") {
      openInitiativeModal();
    } else if (create === "event") {
      openEventModal();
    }
  }, [searchParams, openAnnouncementModal, openInitiativeModal, openEventModal]);

  return (
    <>
      <CreateAnnouncementModal
        open={announcementOpen}
        onClose={handleClose}
        communeId={communeId}
        membershipAddress={membershipAddress}
        presetType={announcementPresetType}
        editId={announcementEditId}
        initialData={announcementInitialData}
      />
      <CreateInitiativeModal
        open={initiativeOpen}
        onClose={handleClose}
        onCreated={handleInitiativeCreated}
        communeId={communeId}
        membershipAddress={membershipAddress}
        editId={initiativeEditId}
        initialData={initiativeInitialData}
      />
      <CreateEventModal
        open={eventOpen}
        onClose={handleClose}
        onCreated={handleEventCreated}
        communeId={communeId}
        membershipAddress={membershipAddress}
        editId={eventEditId}
        initialData={eventInitialData}
        duplicateMode={eventDuplicateMode}
        isOfficial={eventIsOfficial}
        detailHref={eventDetailHref}
      />
    </>
  );
}
