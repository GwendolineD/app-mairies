import { Toaster } from "sonner";
import { AdminShell } from "@/components/features/admin-shell/admin-shell";
import { MunicipalityShellClient } from "@/components/features/municipality-shell-client";
import { requireCommuneStaff } from "@/lib/auth/session";
import {
  MUNICIPALITY_NAV,
  MUNICIPALITY_SIDEBAR_STORAGE_KEY,
  ROUTES,
} from "@/lib/constants/routes";
import { getAnnouncementCategories } from "@/lib/queries/announcement-categories";
import { getInitiativeEventCategories } from "@/lib/queries/initiative-event-categories";
import { pendingReportsBadgeSlots } from "@/components/features/badges/admin-nav-badge-slots";
import { initCategories } from "@/lib/constants/announcement-categories";
import { communeToDefaultAddress } from "@/lib/utils/commune-address";
import { createClient } from "@/lib/supabase/server";
import type { Commune, MembershipAddress } from "@/lib/types";

const EMPTY_ADDRESS: MembershipAddress = {
  street: null,
  city: null,
  citycode: null,
  postcode: null,
  lat: null,
  lng: null,
};

export default async function MunicipalityDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireCommuneStaff();
  const communeId = ctx.communeId;
  const supabase = await createClient();

  const badgeSlots = pendingReportsBadgeSlots(
    ROUTES.mairie.signalements,
    communeId,
  );

  const [categoryRows, initiativeCategoryRows, communeResult] =
    await Promise.all([
      getAnnouncementCategories(),
      getInitiativeEventCategories(),
      supabase
        .from("communes")
        .select(
          "name, postcode, insee_code, centroid_lat, centroid_lng, settings, mairie_address_street, mairie_address_city, mairie_address_postcode, mairie_address_lat, mairie_address_lng",
        )
        .eq("id", communeId)
        .single(),
    ]);

  initCategories(categoryRows);

  let defaultEventAddress: MembershipAddress = EMPTY_ADDRESS;
  if (communeResult.data) {
    defaultEventAddress = communeToDefaultAddress(communeResult.data as Commune);
  }

  return (
    <AdminShell
      navItems={MUNICIPALITY_NAV}
      storageKey={MUNICIPALITY_SIDEBAR_STORAGE_KEY}
      sidebarTitle="Espace Mairie"
      badgeSlots={badgeSlots}
    >
      <MunicipalityShellClient
        communeId={communeId}
        membershipAddress={defaultEventAddress}
        initiativeCategoryRows={initiativeCategoryRows}
      >
        {children}
      </MunicipalityShellClient>
      <Toaster position="top-center" richColors closeButton />
    </AdminShell>
  );
}
