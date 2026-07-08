import { getCategoryLabel } from "@/lib/constants/announcement-categories";
import { getInitiativeCategoryLabel } from "@/lib/constants/initiative-categories";
import type { OutcomeSummary } from "@/lib/queries/dashboard-charts";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";

function successRate(fulfilled: number, unfulfilled: number): string {
  const total = fulfilled + unfulfilled;
  if (total === 0) return "—";
  return `${Math.round((fulfilled / total) * 100)} %`;
}

type Props = {
  stats: OutcomeSummary;
};

export function DashboardOutcomeSection({ stats }: Props) {
  const demandeTotal =
    stats.announcementDemande.fulfilled + stats.announcementDemande.unfulfilled;
  const offreTotal =
    stats.announcementOffre.fulfilled + stats.announcementOffre.unfulfilled;
  const eventTotal = stats.events.fulfilled + stats.events.unfulfilled;

  const hasAnyData = demandeTotal + offreTotal + eventTotal > 0;
  if (!hasAnyData) return null;

  const topCategories = stats.byCategory
    .filter((row) => row.outcome === "fulfilled")
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text">Impact de l&apos;entraide</h2>
        <p className="text-sm font-medium text-muted">
          Retours recueillis lors des suppressions d&apos;annonces et
          d&apos;événements.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Demandes satisfaites"
          value={successRate(
            stats.announcementDemande.fulfilled,
            stats.announcementDemande.unfulfilled,
          )}
          hint={`${stats.announcementDemande.fulfilled} sur ${demandeTotal} retours`}
          accent="coral"
        />
        <StatCard
          label="Offres utiles"
          value={successRate(
            stats.announcementOffre.fulfilled,
            stats.announcementOffre.unfulfilled,
          )}
          hint={`${stats.announcementOffre.fulfilled} sur ${offreTotal} retours`}
          accent="turquoise"
        />
        <StatCard
          label="Événements tenus"
          value={successRate(stats.events.fulfilled, stats.events.unfulfilled)}
          hint={`${stats.events.fulfilled} sur ${eventTotal} retours`}
          accent="orange"
        />
      </div>

      {topCategories.length > 0 ? (
        <Card className="space-y-3 p-6">
          <h3 className="text-base font-semibold text-text">
            Catégories les plus utiles
          </h3>
          <ul className="space-y-2">
            {topCategories.map((row) => {
              const label =
                row.contentKind === "event"
                  ? getInitiativeCategoryLabel(row.categorySlug)
                  : getCategoryLabel(row.categorySlug);

              return (
                <li
                  key={`${row.contentKind}-${row.contentType ?? "none"}-${row.categorySlug}`}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="font-medium text-text">{label}</span>
                  <span className="shrink-0 font-semibold text-mint">
                    {row.count === 1
                      ? "1 retour positif"
                      : `${row.count} retours positifs`}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
