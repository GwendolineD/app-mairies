"use client";

import { Download, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProspectOutreach } from "@/lib/actions/prospect-outreach";
import type { ProspectCommuneDetail } from "@/lib/prospect-communes/types";
import {
  PROSPECT_FIRST_CONTACT_TYPES,
  PROSPECT_OUTCOMES,
  PROSPECT_OUTREACH_STATUSES,
  PROSPECT_FIRST_CONTACT_TYPE_LABELS,
  PROSPECT_OUTCOME_LABELS,
  PROSPECT_OUTREACH_STATUS_LABELS,
} from "@/lib/prospect-outreach/status-display";
import type {
  ProspectFirstContactType,
  ProspectOutcome,
  ProspectOutreachStatus,
} from "@/lib/prospect-outreach/types";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { FormField, Input, formFieldClassName } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toUtcFromParisLocal } from "@/lib/datetime";
import { cn } from "@/lib/utils/cn";
import { CommerceCountInfoPopover } from "./commerce-count-info-popover";
import {
  ProspectionAssociationEnrichmentModal,
  useProspectionAssociationEnrichmentModal,
} from "./prospection-association-enrichment-modal";
import { ProspectNotesEditor } from "./prospect-notes-editor";

type Props = {
  detail: ProspectCommuneDetail;
};

const SELECT_NONE = "__none__";

const selectTriggerClassName = cn(
  formFieldClassName,
  "w-full justify-between py-2 data-[size=default]:h-auto data-[size=default]:md:h-auto",
);

function toDateInput(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function OutreachSelect<T extends string>({
  value,
  onChange,
  options,
  labels,
  placeholder,
}: {
  value: T | "";
  onChange: (value: T | "") => void;
  options: readonly T[];
  labels: Record<T, string>;
  placeholder?: string;
}) {
  const selectValue = value || SELECT_NONE;

  return (
    <Select
      items={[
        { value: SELECT_NONE, label: "—" },
        ...options.map((option) => ({
          value: option,
          label: labels[option],
        })),
      ]}
      value={selectValue}
      onValueChange={(next) => {
        if (!next || next === SELECT_NONE) {
          onChange("");
          return;
        }
        onChange(next as T);
      }}
    >
      <SelectTrigger className={selectTriggerClassName}>
        <SelectValue placeholder={placeholder ?? "Choisir…"} />
      </SelectTrigger>
      <SelectContent align="start">
        <SelectItem value={SELECT_NONE}>—</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {labels[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CountFieldLabel({
  children,
  accessory,
}: {
  children: React.ReactNode;
  accessory?: React.ReactNode;
}) {
  return (
    <div className="flex h-5 items-center gap-1">
      <Label className="font-medium text-text">{children}</Label>
      {accessory ?? <span className="size-5 shrink-0" aria-hidden />}
    </div>
  );
}

export function ProspectionDetailSuiviTab({ detail }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const associationEnrichment = useProspectionAssociationEnrichmentModal();
  const [status, setStatus] = useState<ProspectOutreachStatus>(
    detail.outreach.status,
  );
  const [outcome, setOutcome] = useState<ProspectOutcome | "">(
    detail.outreach.outcome ?? "",
  );
  const [firstContactDate, setFirstContactDate] = useState(
    toDateInput(detail.outreach.first_contact_at),
  );
  const [firstContactType, setFirstContactType] = useState<
    ProspectFirstContactType | ""
  >(detail.outreach.first_contact_type ?? "");
  const [visit1At, setVisit1At] = useState(toDateInput(detail.outreach.visit_1_at));
  const [visit2At, setVisit2At] = useState(toDateInput(detail.outreach.visit_2_at));
  const [councilDemoAt, setCouncilDemoAt] = useState(
    toDateInput(detail.outreach.council_demo_at),
  );
  const [commerceCount, setCommerceCount] = useState(
    detail.outreach.commerce_count?.toString() ?? "",
  );
  const [associationCount, setAssociationCount] = useState(
    detail.outreach.association_count?.toString() ?? "",
  );
  const [notesJson, setNotesJson] = useState<Record<string, unknown> | null>(
    detail.outreach.notes_json,
  );

  useEffect(() => {
    setStatus(detail.outreach.status);
    setOutcome(detail.outreach.outcome ?? "");
    setFirstContactDate(toDateInput(detail.outreach.first_contact_at));
    setFirstContactType(detail.outreach.first_contact_type ?? "");
    setVisit1At(toDateInput(detail.outreach.visit_1_at));
    setVisit2At(toDateInput(detail.outreach.visit_2_at));
    setCouncilDemoAt(toDateInput(detail.outreach.council_demo_at));
    setCommerceCount(detail.outreach.commerce_count?.toString() ?? "");
    setAssociationCount(detail.outreach.association_count?.toString() ?? "");
    setNotesJson(detail.outreach.notes_json);
  }, [detail]);

  const hasChanges = useMemo(() => {
    const outreach = detail.outreach;
    if (status !== outreach.status) return true;
    if (outcome !== (outreach.outcome ?? "")) return true;
    if (firstContactDate !== toDateInput(outreach.first_contact_at)) return true;
    if (firstContactType !== (outreach.first_contact_type ?? "")) return true;
    if (visit1At !== toDateInput(outreach.visit_1_at)) return true;
    if (visit2At !== toDateInput(outreach.visit_2_at)) return true;
    if (councilDemoAt !== toDateInput(outreach.council_demo_at)) return true;
    if (commerceCount !== (outreach.commerce_count?.toString() ?? "")) {
      return true;
    }
    if (associationCount !== (outreach.association_count?.toString() ?? "")) {
      return true;
    }
    return (
      JSON.stringify(notesJson ?? null) !==
      JSON.stringify(outreach.notes_json ?? null)
    );
  }, [
    detail,
    status,
    outcome,
    firstContactDate,
    firstContactType,
    visit1At,
    visit2At,
    councilDemoAt,
    commerceCount,
    associationCount,
    notesJson,
  ]);

  function save() {
    if (!hasChanges || isPending) return;

    startTransition(async () => {
      const firstContactAt = firstContactDate
        ? toUtcFromParisLocal(firstContactDate, "00:00")
        : null;

      const result = await updateProspectOutreach(detail.id, {
        status,
        outcome: status === "completed" ? (outcome as ProspectOutcome) : null,
        first_contact_at: firstContactAt,
        first_contact_type: firstContactType || null,
        visit_1_at: visit1At || null,
        visit_2_at: visit2At || null,
        council_demo_at: councilDemoAt || null,
        commerce_count: commerceCount ? Number.parseInt(commerceCount, 10) : null,
        association_count: associationCount
          ? Number.parseInt(associationCount, 10)
          : null,
        notes_json: notesJson,
      });

      if (!result.success) {
        toast.error(result.error ?? "Enregistrement impossible.");
        return;
      }

      toast.success("Suivi enregistré.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Statut">
          <Select
            items={PROSPECT_OUTREACH_STATUSES.map((value) => ({
              value,
              label: PROSPECT_OUTREACH_STATUS_LABELS[value],
            }))}
            value={status}
            onValueChange={(next) => {
              if (next) setStatus(next as ProspectOutreachStatus);
            }}
          >
            <SelectTrigger className={selectTriggerClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {PROSPECT_OUTREACH_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {PROSPECT_OUTREACH_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {status === "completed" ? (
          <FormField label="Résultat">
            <OutreachSelect
              value={outcome}
              onChange={setOutcome}
              options={PROSPECT_OUTCOMES}
              labels={PROSPECT_OUTCOME_LABELS}
              placeholder="Choisir un résultat"
            />
          </FormField>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Date premier contact">
          <DatePickerField
            value={firstContactDate}
            onChange={setFirstContactDate}
            placeholder="Choisir une date"
            className="w-full"
            aria-label="Date du premier contact"
          />
        </FormField>
        <FormField label="Type de premier contact">
          <OutreachSelect
            value={firstContactType}
            onChange={setFirstContactType}
            options={PROSPECT_FIRST_CONTACT_TYPES}
            labels={PROSPECT_FIRST_CONTACT_TYPE_LABELS}
            placeholder="Choisir un type"
          />
        </FormField>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <FormField label="Visite 1">
          <DatePickerField
            value={visit1At}
            onChange={setVisit1At}
            placeholder="Choisir une date"
            className="w-full"
            aria-label="Date de la visite 1"
          />
        </FormField>
        <FormField label="Visite 2">
          <DatePickerField
            value={visit2At}
            onChange={setVisit2At}
            placeholder="Choisir une date"
            className="w-full"
            aria-label="Date de la visite 2"
          />
        </FormField>
        <FormField label="Conseil municipal">
          <DatePickerField
            value={councilDemoAt}
            onChange={setCouncilDemoAt}
            placeholder="Choisir une date"
            className="w-full"
            aria-label="Date du conseil municipal"
          />
        </FormField>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <CountFieldLabel accessory={<CommerceCountInfoPopover />}>
            Nombre de commerces
          </CountFieldLabel>
          <Input
            type="number"
            min={0}
            className="rounded-sm"
            value={commerceCount}
            onChange={(event) => setCommerceCount(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <CountFieldLabel>Nombre d&apos;associations</CountFieldLabel>
          <Input
            type="number"
            min={0}
            className="rounded-sm"
            value={associationCount}
            onChange={(event) => setAssociationCount(event.target.value)}
          />
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="cursor-pointer"
        onClick={() => associationEnrichment.fetchEnrichment(detail.id)}
      >
        <Search className="size-4" aria-hidden />
        Rechercher associations
      </Button>

      <FormField label="Notes (journal des échanges)">
        <ProspectNotesEditor value={notesJson} onChange={setNotesJson} />
      </FormField>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
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
          variant="secondary"
          size="sm"
          className="cursor-pointer"
          nativeButton={false}
          render={
            <a
              href={`/api/backoffice/prospect-communes/${detail.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <Download className="size-4" aria-hidden />
          Télécharger PDF
        </Button>
      </div>

      <ProspectionAssociationEnrichmentModal
        open={associationEnrichment.open}
        onClose={() => associationEnrichment.setOpen(false)}
        loading={associationEnrichment.loading}
        result={associationEnrichment.result}
        onApplyAssociation={(value) => setAssociationCount(String(value))}
      />
    </div>
  );
}
