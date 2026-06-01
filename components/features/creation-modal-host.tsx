"use client";

import { useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isAnnouncementType, type AnnouncementType } from "@/lib/constants/announcement-types";
import { ROUTES } from "@/lib/constants/routes";
import { buildAnnouncementListQuery } from "@/lib/utils/search-params";
import { CreateAnnouncementModal } from "@/components/features/create-announcement-modal";
import { CreateInitiativeModal } from "@/components/features/create-initiative-modal";
import { useCreationModals } from "@/components/features/creation-modal-context";

type Props = {
  communeId: string;
};

export function CreationModalHost({ communeId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    announcementOpen,
    initiativeOpen,
    announcementPresetType,
    openAnnouncementModal,
    openInitiativeModal,
    closeModals,
  } = useCreationModals();

  const stripCreateFromUrl = useCallback(() => {
    const create = searchParams.get("create");
    if (!create) return;
    const next = buildAnnouncementListQuery({
      vue: searchParams.get("vue") === "carte" ? "carte" : "liste",
      type: isAnnouncementType(searchParams.get("type") ?? "")
        ? (searchParams.get("type") as "demande" | "offre")
        : undefined,
      categorie: searchParams.get("categorie") ?? undefined,
      page: Number.parseInt(searchParams.get("page") ?? "1", 10) || 1,
    });
    const path =
      searchParams.get("create") === "initiative"
        ? `${ROUTES.initiatives.list}${next}`
        : `${ROUTES.annonces.list}${next}`;
    router.replace(path);
  }, [router, searchParams]);

  const handleClose = useCallback(() => {
    closeModals();
    stripCreateFromUrl();
  }, [closeModals, stripCreateFromUrl]);

  useEffect(() => {
    const create = searchParams.get("create");
    if (create === "annonce") {
      const typeParam = searchParams.get("type") ?? searchParams.get("createType") ?? "";
      const preset: AnnouncementType = isAnnouncementType(typeParam) ? typeParam : "demande";
      openAnnouncementModal({ presetType: preset });
    } else if (create === "initiative") {
      openInitiativeModal();
    }
  }, [searchParams, openAnnouncementModal, openInitiativeModal]);

  return (
    <>
      <CreateAnnouncementModal
        open={announcementOpen}
        onClose={handleClose}
        communeId={communeId}
        presetType={announcementPresetType}
      />
      <CreateInitiativeModal
        open={initiativeOpen}
        onClose={handleClose}
        communeId={communeId}
      />
    </>
  );
}
