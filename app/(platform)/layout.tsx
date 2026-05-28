import { NavLink } from "@/components/ui/nav-link";
import { requireRole } from "@/lib/auth/session";

const LINKS = [
  { href: "/platform/admin", label: "Vue d'ensemble" },
  { href: "/platform/communes", label: "Communes pilotées" },
  { href: "/platform/leads", label: "Leads pré-inscription" },
  { href: "/platform/stats", label: "Statistiques" },
];

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["platform_admin"]);

  return (
    <div className="min-h-dvh bg-background pb-12">
      <header className="border-b border-border bg-surface px-5 py-6 shadow-card">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted">
          Backoffice plateforme
        </p>
        <h1 className="text-[28px] font-bold leading-9 text-text">
          Administration Vie Locale
        </h1>
      </header>
      <nav className="flex flex-wrap gap-2 px-5 py-4">
        {LINKS.map((l) => (
          <NavLink key={l.href} href={l.href} label={l.label} />
        ))}
      </nav>
      <main className="px-5 py-4">{children}</main>
    </div>
  );
}
