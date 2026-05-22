import Link from "next/link";
import { requireRole } from "@/lib/auth/session";

const LINKS = [
  { href: "/mairie", label: "Tableau mairie" },
  { href: "/mairie/habitants", label: "Habitant·es" },
  { href: "/mairie/parametres", label: "Paramètres" },
  { href: "/mairie/signalements", label: "Signalements" },
  { href: "/mairie/evenements/nouveau", label: "+ Événement" },
];

export default async function MunicipalityDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["municipality_staff"]);

  return (
    <div className="min-h-dvh bg-warm pb-12">
      <header className="border-b border-border bg-surface/90 px-4 py-6 shadow-card">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted">
          Espace municipalité
        </p>
        <h1 className="text-xl font-black text-text">Pilotage empathique Vie Locale</h1>
      </header>
      <nav className="flex flex-wrap gap-2 px-4 py-4">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-text"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <main className="mt-4 px-4">{children}</main>
    </div>
  );
}
