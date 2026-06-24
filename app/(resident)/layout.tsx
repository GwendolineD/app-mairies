import { Toaster } from "sonner";
import { BottomNav } from "@/components/features/resident-nav";
import { ResidentSidebar } from "@/components/features/resident-sidebar";
import { ResidentHeader } from "@/components/features/resident-header";
import { ResidentShellClient } from "@/components/features/resident-shell-client";
import { getResidentBackofficeNav } from "@/lib/auth/permissions";
import { requireActiveMembership } from "@/lib/auth/session";
import { getPlatformSupportEmail } from "@/lib/actions/platform-settings";
import { membershipToAddress } from "@/lib/types";
import { countUnreadMessages } from "@/lib/queries/messages";
import { createClient } from "@/lib/supabase/server";
import { getAnnouncementCategories } from "@/lib/queries/announcement-categories";
import { initCategories } from "@/lib/constants/announcement-categories";
import { getInitiativeEventCategories } from "@/lib/queries/initiative-event-categories";
import { initInitiativeEventCategories } from "@/lib/constants/initiative-categories";

export default async function ResidentRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireActiveMembership();
  const backofficeLinks = getResidentBackofficeNav(ctx);
  const supabase = await createClient();

  const [unreadMessages, categoryRows, initiativeCategoryRows, supportEmail] = await Promise.all([
    countUnreadMessages(supabase, ctx.activeMembership!.commune_id),
    getAnnouncementCategories(),
    getInitiativeEventCategories(),
    getPlatformSupportEmail(),
  ]);

  initCategories(categoryRows);
  initInitiativeEventCategories(initiativeCategoryRows);

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-text">
      <ResidentHeader
        profile={ctx.profile}
        memberships={ctx.memberships}
        activeCommuneId={
          ctx.profile.active_commune_id ?? ctx.activeMembership?.commune_id
        }
        backofficeLinks={backofficeLinks}
        supportEmail={supportEmail}
      />

      <div className="flex min-h-0 w-full flex-1">
        <ResidentSidebar unreadMessages={unreadMessages} supportEmail={supportEmail} />

        <main className="min-w-0 flex-1 overflow-y-auto bg-surface px-5 py-4 pb-28 md:px-6 md:py-6 md:pb-6 lg:px-8">
          <ResidentShellClient
            communeId={ctx.activeMembership!.commune_id}
            membershipAddress={membershipToAddress(ctx.activeMembership!)}
            announcementCategoryRows={categoryRows}
            initiativeCategoryRows={initiativeCategoryRows}
            hasSeenOnboarding={ctx.profile.has_seen_onboarding ?? false}
            communeName={ctx.activeMembership!.commune?.name ?? "votre commune"}
          >
            {children}
          </ResidentShellClient>
        </main>
      </div>

      <BottomNav unreadMessages={unreadMessages} />
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}
