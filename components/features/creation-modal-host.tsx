"use client";

import { useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isAnnouncementType, type AnnouncementType } from "@/lib/constants/announcement-types";
import { ROUTES } from "@/lib/constants/routes";
import { buildAnnouncementListQuery } from "@/lib/utils/search-params";
import { CreateAnnouncementModal } from "@/components/features/create-announcement-modal";
import { CreateInitiativeModal } from "@/components/features/create-initiative-modal";
import { useCreationModals } from "@/components/features/creation-modal-context";
import type { MembershipAddress } from "@/lib/types";

type Props = {
  communeId: string;
  membershipAddress: MembershipAddress;
};

export function CreationModalHost({ communeId, membershipAddress }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    announcementOpen,
    initiativeOpen,
    announcementPresetType,
    announcementEditId,
    announcementInitialData,
    initiativeEditId,
    initiativeInitialData,
    openAnnouncementModal,
    openInitiativeModal,
    closeModals,
  } = useCreationModals();

  const stripCreateFromUrl = useCallback(() => {
    const create = searchParams.get("create");
    if (!create) return;
    const catParam = searchParams.get("cat") ?? searchParams.get("categorie");
    const next = buildAnnouncementListQuery({
      vue: searchParams.get("vue") === "carte" ? "carte" : "liste",
      type: isAnnouncementType(searchParams.get("type") ?? "")
        ? (searchParams.get("type") as "demande" | "offre")
        : undefined,
      categories: catParam
        ? catParam.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
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
        membershipAddress={membershipAddress}
        presetType={announcementPresetType}
        editId={announcementEditId}
        initialData={announcementInitialData}
      />
      <CreateInitiativeModal
        open={initiativeOpen}
        onClose={handleClose}
        communeId={communeId}
        membershipAddress={membershipAddress}
        editId={initiativeEditId}
        initialData={initiativeInitialData}
      />
    </>
  );
}
