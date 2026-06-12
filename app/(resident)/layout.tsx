import { BottomNav } from "@/components/features/resident-nav";
import { ResidentSidebar } from "@/components/features/resident-sidebar";
import { ResidentHeader } from "@/components/features/resident-header";
import { ResidentShellClient } from "@/components/features/resident-shell-client";
import { getResidentBackofficeNav } from "@/lib/auth/permissions";
import { requireActiveMembership } from "@/lib/auth/session";

export default async function ResidentRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireActiveMembership();
  const backofficeLinks = getResidentBackofficeNav(ctx);

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-text">
      <ResidentHeader
        profile={ctx.profile}
        memberships={ctx.memberships}
        activeCommuneId={
          ctx.profile.active_commune_id ?? ctx.activeMembership?.commune_id
        }
        backofficeLinks={backofficeLinks}
      />

      <div className="flex min-h-0 w-full flex-1">
        <ResidentSidebar />

        <main className="min-w-0 flex-1 overflow-y-auto bg-surface px-4 py-4 pb-28 md:px-6 md:py-6 md:pb-6 lg:px-8">
          <ResidentShellClient communeId={ctx.activeMembership!.commune_id}>
            {children}
          </ResidentShellClient>
        </main>
      </div>

      <BottomNav backofficeLinks={backofficeLinks} />
    </div>
  );
}
