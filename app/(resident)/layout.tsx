import { BottomNav, ResidentSidebarNav } from "@/components/features/resident-nav";
import { CommuneSwitcher } from "@/components/features/commune-switcher";
import { requireActiveMembership } from "@/lib/auth/session";
import { signOut } from "@/lib/actions/auth";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";

export default async function ResidentRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireActiveMembership();
  const communeName =
    ctx.activeMembership?.commune?.name ??
    ctx.memberships.find((m) => m.commune_id === ctx.activeCommuneId)?.commune?.name ??
    "Vie locale";

  return (
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
  );
}
