<<<<<<< HEAD
import { BottomNav, ResidentSidebarNav } from "@/components/features/resident-nav";
import { CommuneSwitcher } from "@/components/features/commune-switcher";
import { MessagingProvider } from "@/components/features/messaging/messaging-provider";
import { PushRegistrar } from "@/components/features/messaging/push-registrar";
import { requireActiveMembership } from "@/lib/auth/session";
import { getUnreadCount } from "@/lib/data/messages";
import { signOut } from "@/lib/actions/auth";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
=======
import { BottomNav } from "@/components/features/resident-nav";
import { ResidentSidebar } from "@/components/features/resident-sidebar";
import { ResidentHeader } from "@/components/features/resident-header";
import { ResidentShellClient } from "@/components/features/resident-shell-client";
import { getResidentBackofficeNav } from "@/lib/auth/permissions";
import { requireActiveMembership } from "@/lib/auth/session";
import { membershipToAddress } from "@/lib/types";
import { countUnreadMessages } from "@/lib/queries/messages";
import { createClient } from "@/lib/supabase/server";
import { getAnnouncementCategories } from "@/lib/queries/announcement-categories";
import { initCategories } from "@/lib/constants/announcement-categories";
>>>>>>> preprod

export default async function ResidentRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireActiveMembership();
<<<<<<< HEAD
  const communeId = ctx.activeMembership!.commune_id;
  const communeName =
    ctx.activeMembership?.commune?.name ??
    ctx.memberships.find((m) => m.commune_id === ctx.activeCommuneId)?.commune?.name ??
    "Vie locale";
  const initialUnread = await getUnreadCount(communeId);

  return (
    <MessagingProvider
      currentUserId={ctx.userId}
      communeId={communeId}
      initialUnread={initialUnread}
    >
      <div className="min-h-dvh bg-background text-text">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl">
        <aside className="hidden shrink-0 flex-col border-r border-border/80 bg-surface/50 px-3 py-6 md:flex md:w-56 lg:w-64">
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted">
            Vie Locale
          </p>
          <p className="mb-6 px-3 text-lg font-bold leading-7 text-text">{communeName}</p>
          <ResidentSidebarNav />
        </aside>

        <div className="flex min-h-dvh min-w-0 flex-1 flex-col pb-28 md:pb-0">
          <header className="sticky top-0 z-30 border-b border-border/80 bg-surface/90 px-4 py-4 backdrop-blur md:px-6 lg:px-8">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="md:hidden">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                    Espace résident·e
                  </p>
                  <h2 className="text-[28px] font-bold leading-9 text-text">{communeName}</h2>
                </div>
                <div className="hidden md:block">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                    Espace résident·e
                  </p>
                  <h2 className="text-2xl font-bold leading-8 text-text">{communeName}</h2>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button href={ROUTES.profil} variant="secondary" className="px-3 py-1.5 text-xs">
                    Profil
                  </Button>
                  <form action={signOut}>
                    <Button type="submit" variant="ghost" className="px-3 py-1.5 text-xs">
                      Sortir
                    </Button>
                  </form>
                </div>
              </div>
              <CommuneSwitcher
                memberships={ctx.memberships}
                activeCommuneId={
                  ctx.profile.active_commune_id ?? ctx.activeMembership?.commune_id
                }
              />
            </div>
          </header>
          <main className="flex-1 px-4 py-4 md:px-6 md:py-6 lg:px-8">{children}</main>
          <BottomNav />
        </div>
      </div>
      </div>
      <PushRegistrar />
    </MessagingProvider>
=======
  const backofficeLinks = getResidentBackofficeNav(ctx);
  const supabase = await createClient();

  const [unreadMessages, categoryRows] = await Promise.all([
    countUnreadMessages(supabase, ctx.activeMembership!.commune_id),
    getAnnouncementCategories(),
  ]);

  initCategories(categoryRows);

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
        <ResidentSidebar unreadMessages={unreadMessages} />

        <main className="min-w-0 flex-1 overflow-y-auto bg-surface px-4 py-4 pb-28 md:px-6 md:py-6 md:pb-6 lg:px-8">
          <ResidentShellClient
            communeId={ctx.activeMembership!.commune_id}
            membershipAddress={membershipToAddress(ctx.activeMembership!)}
          >
            {children}
          </ResidentShellClient>
        </main>
      </div>

      <BottomNav unreadMessages={unreadMessages} />
    </div>
>>>>>>> preprod
  );
}
