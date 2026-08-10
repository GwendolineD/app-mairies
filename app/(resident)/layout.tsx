import { Suspense } from "react";
import { Toaster } from "sonner";
import { BottomNav } from "@/components/features/resident-nav";
import { ResidentSidebar } from "@/components/features/resident-sidebar";
import { ResidentHeader } from "@/components/features/resident-header";
import { PwaInstallBanner } from "@/components/features/pwa/pwa-install-banner";
import { NotificationPromptBanner } from "@/components/features/notification-prompt-banner";
import { ResidentShellClient } from "@/components/features/resident-shell-client";
import { UnreadMessagesBadgeAsync } from "@/components/features/badges/unread-messages-badge-async";
import { getResidentBackofficeNav } from "@/lib/auth/permissions";
import { requireActiveMembership } from "@/lib/auth/session";
import { getPlatformSupportEmail } from "@/lib/actions/platform-settings";
import { getPushPublicKey } from "@/lib/actions/notifications";
import { membershipToAddress } from "@/lib/types";
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

  const communeId = ctx.activeMembership!.commune_id;

  const messagesBadgeSlots = {
    sidebar: (
      <Suspense fallback={null}>
        <UnreadMessagesBadgeAsync communeId={communeId} variant="sidebar-pill" />
      </Suspense>
    ),
    sidebarCollapsed: (
      <Suspense fallback={null}>
        <UnreadMessagesBadgeAsync communeId={communeId} variant="sidebar-dot" />
      </Suspense>
    ),
    bottom: (
      <Suspense fallback={null}>
        <UnreadMessagesBadgeAsync communeId={communeId} variant="bottom-pill" />
      </Suspense>
    ),
  };

  const [
    categoryRows,
    initiativeCategoryRows,
    supportEmail,
    pushPublicKey,
  ] = await Promise.all([
    getAnnouncementCategories(),
    getInitiativeEventCategories(),
    getPlatformSupportEmail(),
    getPushPublicKey(),
  ]);

  initCategories(categoryRows);
  initInitiativeEventCategories(initiativeCategoryRows);

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-text">
      <ResidentHeader
        profile={ctx.profile}
        memberships={ctx.memberships}
        activeCommuneId={ctx.activeCommuneId}
        backofficeLinks={backofficeLinks}
        supportEmail={supportEmail}
      />

      <div className="flex min-h-0 w-full flex-1">
        <ResidentSidebar
          messagesBadgeSlots={messagesBadgeSlots}
          supportEmail={supportEmail}
        />

        <main className="min-w-0 flex-1 overflow-y-auto bg-surface px-5 pb-28 md:px-6 md:pb-6 lg:px-8">
          <PwaInstallBanner
            hasSeenOnboarding={ctx.profile.has_seen_onboarding ?? false}
          />
          <NotificationPromptBanner
            hasSeenOnboarding={ctx.profile.has_seen_onboarding ?? false}
            hasDismissedNotificationPrompt={
              ctx.profile.has_dismissed_notification_prompt ?? false
            }
            pushPublicKey={pushPublicKey}
          />
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

      <BottomNav messagesBadgeSlots={messagesBadgeSlots} />
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}
