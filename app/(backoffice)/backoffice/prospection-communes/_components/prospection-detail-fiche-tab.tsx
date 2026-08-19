"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProspectCommuneReference } from "@/lib/actions/prospect-outreach";
import { formatHorairesPdfLines } from "@/lib/prospect-communes/format-horaires-display";
import type {
  ProspectCommuneDetail,
  ProspectConseiller,
} from "@/lib/prospect-communes/types";
import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea } from "@/components/ui/form-field";
import { ProspectionDetailDeleteButton } from "./prospection-detail-delete-button";

type Props = {
  detail: ProspectCommuneDetail;
};

function emptyConseiller(): ProspectConseiller {
  return { nom: "", prenom: "", fonction: "" };
}

function normalizeConseillers(conseillers: ProspectConseiller[]) {
  return conseillers
    .filter((person) => person.nom.trim() || person.prenom.trim())
    .map((person) => ({
      nom: person.nom.trim(),
      prenom: person.prenom.trim(),
      fonction: person.fonction.trim(),
    }));
}

function buildFicheSnapshot(detail: ProspectCommuneDetail) {
  return {
    maire: (detail.maire ?? "").trim(),
    adresse: detail.adresse_mairie.trim(),
    telephones: detail.telephones.join("\n"),
    emails: detail.emails.join("\n"),
    horaires: (detail.horaires_ouverture ?? "").trim(),
    conseillers: normalizeConseillers(detail.conseillers),
  };
}

export function ProspectionDetailFicheTab({ detail }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [maire, setMaire] = useState(detail.maire ?? "");
  const [adresse, setAdresse] = useState(detail.adresse_mairie);
  const [telephones, setTelephones] = useState(detail.telephones.join("\n"));
  const [emails, setEmails] = useState(detail.emails.join("\n"));
  const [horaires, setHoraires] = useState(detail.horaires_ouverture ?? "");
  const [conseillers, setConseillers] = useState<ProspectConseiller[]>(
    detail.conseillers,
  );

  useEffect(() => {
    setEditing(false);
  }, [detail.id]);

  useEffect(() => {
    if (editing) return;

    setMaire(detail.maire ?? "");
    setAdresse(detail.adresse_mairie);
    setTelephones(detail.telephones.join("\n"));
    setEmails(detail.emails.join("\n"));
    setHoraires(detail.horaires_ouverture ?? "");
    setConseillers(detail.conseillers);
  }, [detail, editing]);

  const hasChanges = useMemo(() => {
    const initial = buildFicheSnapshot(detail);
    const current = {
      maire: maire.trim(),
      adresse: adresse.trim(),
      telephones: telephones.trim(),
      emails: emails.trim(),
      horaires: horaires.trim(),
      conseillers: normalizeConseillers(conseillers),
    };

    return JSON.stringify(current) !== JSON.stringify(initial);
  }, [detail, maire, adresse, telephones, emails, horaires, conseillers]);

  function resetForm() {
    setMaire(detail.maire ?? "");
    setAdresse(detail.adresse_mairie);
    setTelephones(detail.telephones.join("\n"));
    setEmails(detail.emails.join("\n"));
    setHoraires(detail.horaires_ouverture ?? "");
    setConseillers(detail.conseillers);
  }

  function startEditing() {
    resetForm();
    setEditing(true);
  }

  function cancelEditing() {
    resetForm();
    setEditing(false);
  }

  function save() {
    if (!hasChanges || isPending) return;

    startTransition(async () => {
      const result = await updateProspectCommuneReference(detail.id, {
        maire: maire.trim() || null,
        adresse_mairie: adresse.trim(),
        telephones: telephones
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),
        emails: emails
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),
        horaires_ouverture: horaires.trim() || null,
        conseillers: conseillers.filter(
          (person) => person.nom.trim() || person.prenom.trim(),
        ),
      });

      if (!result.success) {
        toast.error(result.error ?? "Enregistrement impossible.");
        return;
      }

      toast.success("Fiche enregistrée.");
      setEditing(false);
      router.refresh();
    });
  }

  if (!editing) {
    const horairesLines = formatHorairesPdfLines(detail.horaires_ouverture);

    return (
      <div className="space-y-4 text-sm">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            aria-label="Modifier la fiche"
            className="cursor-pointer"
            onClick={startEditing}
          >
            <Pencil className="size-4" aria-hidden />
          </Button>
        </div>

        <section className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
            Maire
          </p>
          <p className="font-medium text-text">{detail.maire ?? "—"}</p>
        </section>
        <section className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
            Adresse mairie
          </p>
          <p className="text-text">{detail.adresse_mairie}</p>
        </section>
        <section className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
            Contact
          </p>
          <p className="text-text">
            {detail.telephones.length > 0 ? detail.telephones.join(" · ") : "—"}
          </p>
          <p className="break-all text-text">
            {detail.emails.length > 0 ? detail.emails.join(" · ") : "—"}
          </p>
        </section>
        <section className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
            Horaires
          </p>
          {horairesLines.length === 0 ? (
            <p className="text-text">Non renseignés</p>
          ) : (
            <div className="space-y-0.5">
              {horairesLines.map((line, index) => (
                <p key={`${index}-${line}`} className="text-text">
                  {line}
                </p>
              ))}
            </div>
          )}
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
    );
  }

  return (
    <div className="space-y-4">
      <FormField label="Maire">
        <Input
          className="rounded-sm"
          value={maire}
          onChange={(event) => setMaire(event.target.value)}
        />
      </FormField>
      <FormField label="Adresse mairie">
        <Input
          className="rounded-sm"
          value={adresse}
          onChange={(event) => setAdresse(event.target.value)}
        />
      </FormField>
      <FormField label="Téléphones (un par ligne)">
        <Textarea
          className="rounded-sm"
          value={telephones}
          onChange={(event) => setTelephones(event.target.value)}
        />
      </FormField>
      <FormField label="Emails (un par ligne)">
        <Textarea
          className="rounded-sm"
          value={emails}
          onChange={(event) => setEmails(event.target.value)}
        />
      </FormField>
      <FormField label="Horaires">
        <Textarea
          className="rounded-sm"
          value={horaires}
          onChange={(event) => setHoraires(event.target.value)}
        />
      </FormField>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-text">Conseillers</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            onClick={() => setConseillers((rows) => [...rows, emptyConseiller()])}
          >
            <Plus className="size-4" aria-hidden />
            Ajouter
          </Button>
        </div>
        {conseillers.map((person, index) => (
          <div
            key={`conseiller-${index}`}
            className="grid gap-2 rounded-sm border border-border bg-warm p-3 sm:grid-cols-3"
          >
            <Input
              className="rounded-sm"
              placeholder="Prénom"
              value={person.prenom}
              onChange={(event) =>
                setConseillers((rows) =>
                  rows.map((row, i) =>
                    i === index ? { ...row, prenom: event.target.value } : row,
                  ),
                )
              }
            />
            <Input
              className="rounded-sm"
              placeholder="Nom"
              value={person.nom}
              onChange={(event) =>
                setConseillers((rows) =>
                  rows.map((row, i) =>
                    i === index ? { ...row, nom: event.target.value } : row,
                  ),
                )
              }
            />
            <div className="flex gap-2">
              <Input
                className="rounded-sm"
                placeholder="Fonction"
                value={person.fonction}
                onChange={(event) =>
                  setConseillers((rows) =>
                    rows.map((row, i) =>
                      i === index
                        ? { ...row, fonction: event.target.value }
                        : row,
                    ),
                  )
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 cursor-pointer"
                aria-label="Supprimer"
                onClick={() =>
                  setConseillers((rows) => rows.filter((_, i) => i !== index))
                }
              >
                <Trash2 className="size-4 text-coral" aria-hidden />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="cursor-pointer"
          disabled={isPending || !hasChanges}
          onClick={save}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          Enregistrer
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="cursor-pointer"
          disabled={isPending}
          onClick={cancelEditing}
        >
          Annuler
        </Button>
        <ProspectionDetailDeleteButton
          prospectCommuneId={detail.id}
          communeName={detail.commune}
        />
      </div>
    </div>
  );
}
