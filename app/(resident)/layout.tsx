import Link from "next/link";
import { BottomNav } from "@/components/features/bottom-nav";
import { CommuneSwitcher } from "@/components/features/commune-switcher";
import { requireActiveMembership } from "@/lib/auth/session";
import { signOut } from "@/lib/actions/auth";
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
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background text-text pb-28">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-surface/90 px-4 py-4 backdrop-blur">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                Espace résident·e
              </p>
              <h2 className="text-lg font-extrabold leading-tight text-text">
                {communeName}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/profil"
                className="rounded-full bg-warm px-3 py-1.5 text-xs font-semibold text-text"
              >
                Profil
              </Link>
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
      <main className="flex-1">{children}</main>
      <BottomNav />
    </div>
  );
}
