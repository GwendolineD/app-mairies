import { AdminShell } from "@/components/features/admin-shell/admin-shell";
import { MunicipalityShellClient } from "@/components/features/municipality-shell-client";
import { requireCommuneStaff } from "@/lib/auth/session";
import {
  MUNICIPALITY_NAV,
  MUNICIPALITY_SIDEBAR_STORAGE_KEY,
} from "@/lib/constants/routes";
import { getAnnouncementCategories } from "@/lib/queries/announcement-categories";
import { getInitiativeEventCategories } from "@/lib/queries/initiative-event-categories";
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

  const [categoryRows, initiativeCategoryRows] = await Promise.all([
    getAnnouncementCategories(),
    getInitiativeEventCategories(),
  ]);

  initCategories(categoryRows);

  const communeId = ctx.communeId;
  let defaultEventAddress: MembershipAddress = EMPTY_ADDRESS;

  const membershipCommune = ctx.activeMembership?.commune;
  if (membershipCommune) {
    defaultEventAddress = communeToDefaultAddress(membershipCommune as Commune);
  } else {
    const supabase = await createClient();
    const { data: commune } = await supabase
      .from("communes")
      .select(
        "name, postcode, insee_code, centroid_lat, centroid_lng, settings, mairie_address_street, mairie_address_city, mairie_address_postcode, mairie_address_lat, mairie_address_lng",
      )
      .eq("id", communeId)
      .single();

    if (commune) {
      defaultEventAddress = communeToDefaultAddress(commune as Commune);
    }
  }

  return (
    <AdminShell
      navItems={MUNICIPALITY_NAV}
      storageKey={MUNICIPALITY_SIDEBAR_STORAGE_KEY}
      sidebarTitle="Espace Mairie"
    >
      <MunicipalityShellClient
        communeId={communeId}
        membershipAddress={defaultEventAddress}
        initiativeCategoryRows={initiativeCategoryRows}
      >
        {children}
      </MunicipalityShellClient>
    </AdminShell>
  );
}
