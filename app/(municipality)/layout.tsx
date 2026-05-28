import { NavLink } from "@/components/ui/nav-link";
import { requireRole } from "@/lib/auth/session";
import { MUNICIPALITY_NAV } from "@/lib/constants/routes";
import { USER_ROLES } from "@/lib/constants/roles";

export default async function MunicipalityDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole([USER_ROLES.municipalityStaff]);

  return (
    <div className="min-h-dvh bg-warm pb-12">
      <header className="border-b border-border bg-surface/90 px-4 py-6 shadow-card">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted">
          Espace municipalité
        </p>
        <h1 className="text-[28px] font-bold leading-9 text-text">
          Pilotage empathique Vie Locale
        </h1>
      </header>
      <nav className="flex flex-wrap gap-2 px-4 py-4">
        {MUNICIPALITY_NAV.map((l) => (
          <NavLink key={l.href} href={l.href} label={l.label} />
        ))}
      </nav>
      <main className="mt-4 px-4">{children}</main>
    </div>
  );
}
