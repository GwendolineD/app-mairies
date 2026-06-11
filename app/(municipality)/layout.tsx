import { NavLink } from "@/components/ui/nav-link";
import { requireCommuneStaff } from "@/lib/auth/session";
import { MUNICIPALITY_NAV } from "@/lib/constants/routes";

export default async function MunicipalityDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCommuneStaff();

  return (
    <div className="min-h-dvh bg-warm">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl">
        <aside className="hidden shrink-0 flex-col border-r border-border/80 bg-surface/50 px-3 py-6 lg:flex lg:w-60">
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted">
            Municipalité
          </p>
          <p className="mb-6 px-3 text-lg font-bold leading-7 text-text">Pilotage</p>
          <nav className="flex flex-col gap-1">
            {MUNICIPALITY_NAV.map((l) => (
              <NavLink key={l.href} href={l.href} label={l.label} variant="sidebar" />
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col pb-12">
          <header className="border-b border-border bg-surface/90 px-4 py-6 shadow-card lg:px-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted">
              Espace municipalité
            </p>
            <h1 className="text-[28px] font-bold leading-9 text-text lg:text-3xl">
              Pilotage empathique Vie Locale
            </h1>
          </header>
          <nav className="flex flex-wrap gap-2 border-b border-border/60 px-4 py-4 lg:hidden">
            {MUNICIPALITY_NAV.map((l) => (
              <NavLink key={l.href} href={l.href} label={l.label} />
            ))}
          </nav>
          <main className="mt-4 px-4 lg:mt-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
