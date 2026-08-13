"use client";

import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  buildProspectCommunesQuery,
  mergeProspectCommunesParams,
  type ProspectCommunesListParams,
} from "@/lib/prospect-communes/filter-params";
import type { ProspectCommuneDetail } from "@/lib/prospect-communes/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  detail: ProspectCommuneDetail;
  params: ProspectCommunesListParams;
};

export function ProspectionDetailSheet({ detail, params }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  function close() {
    startTransition(() => {
      router.replace(
        `${pathname}${buildProspectCommunesQuery(
          mergeProspectCommunesParams(params, { detailId: undefined }),
        )}`,
      );
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label="Fermer la fiche"
        className="fixed inset-0 z-40 cursor-pointer bg-text/20 md:bg-transparent"
        onClick={close}
      />
      <aside
        className={cn(
          "fixed z-50 flex max-h-[85dvh] w-full flex-col overflow-hidden bg-surface shadow-card",
          "inset-x-0 bottom-0 rounded-t-xl md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[420px] md:rounded-none md:border-l md:border-border",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold text-text">{detail.commune}</h2>
            <p className="text-xs text-muted">
              Dept. {detail.departement}
              {detail.postcode ? ` · ${detail.postcode}` : null}
              {detail.insee_code ? ` · INSEE ${detail.insee_code}` : null}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            onClick={close}
          >
            <X className="size-4" aria-hidden />
            Fermer
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
          <section className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
              Maire
            </p>
            <p className="font-medium text-text">{detail.maire ?? "—"}</p>
            <p className="text-muted">
              {detail.population.toLocaleString("fr-FR")} habitants
              {detail.distance_km != null
                ? ` · ${detail.distance_km} km (réf.)`
                : null}
            </p>
          </section>

          <section className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
              Adresse mairie
            </p>
            <p className="font-medium text-text">{detail.adresse_mairie}</p>
            {detail.geocode_source === "failed" ? (
              <p className="text-xs text-coral">Géocodage non disponible</p>
            ) : detail.geocode_source === "centroid" ? (
              <p className="text-xs text-muted">Position approximative (centroïde)</p>
            ) : null}
          </section>

          <section className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
              Contact
            </p>
            {detail.telephones.length > 0 ? (
              <p className="text-text">{detail.telephones.join(" · ")}</p>
            ) : (
              <p className="text-muted">Aucun téléphone</p>
            )}
            {detail.emails.length > 0 ? (
              <p className="break-all text-text">{detail.emails.join(" · ")}</p>
            ) : (
              <p className="text-muted">Aucun email</p>
            )}
          </section>

          <section className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
              Horaires
            </p>
            <p className="text-text">
              {detail.horaires_ouverture?.trim() || "Non renseignés"}
            </p>
          </section>

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
              Conseillers ({detail.conseillers.length})
            </p>
            <ul className="space-y-2">
              {detail.conseillers.map((person) => (
                <li
                  key={`${person.nom}-${person.prenom}-${person.fonction}`}
                  className="rounded-sm border border-border/60 bg-warm px-3 py-2"
                >
                  <p className="font-medium text-text">
                    {person.prenom} {person.nom}
                  </p>
                  <p className="text-xs text-muted">{person.fonction}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </aside>
    </>
  );
}
