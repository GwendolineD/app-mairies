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
import { TimePickerField } from "@/components/ui/time-picker-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fromScheduleIso,
  scheduleHasChanged,
  toScheduleIso,
  toUtcFromParisLocal,
} from "@/lib/datetime";
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

const PROSPECT_SCHEDULE_MIN_TIME = "06:00";
const PROSPECT_SCHEDULE_MAX_TIME = "22:00";

function ScheduleFieldRow({
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
  dateAriaLabel,
  timeAriaLabel,
}: {
  label: string;
  date: string;
  time: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  dateAriaLabel: string;
  timeAriaLabel: string;
}) {
  return (
    <FormField label={label}>
      <div className="grid grid-cols-2 gap-3">
        <DatePickerField
          value={date}
          onChange={onDateChange}
          placeholder="Choisir une date"
          className="w-full"
          aria-label={dateAriaLabel}
        />
        <TimePickerField
          value={time}
          onChange={onTimeChange}
          placeholder="Heure"
          className="w-full"
          aria-label={timeAriaLabel}
          minTime={PROSPECT_SCHEDULE_MIN_TIME}
          maxTime={PROSPECT_SCHEDULE_MAX_TIME}
        />
      </div>
    </FormField>
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
  const visit1Fields = fromScheduleIso(detail.outreach.visit_1_at);
  const visit2Fields = fromScheduleIso(detail.outreach.visit_2_at);
  const councilDemoFields = fromScheduleIso(detail.outreach.council_demo_at);

  const [visit1Date, setVisit1Date] = useState(visit1Fields.date);
  const [visit1Time, setVisit1Time] = useState(visit1Fields.time);
  const [visit2Date, setVisit2Date] = useState(visit2Fields.date);
  const [visit2Time, setVisit2Time] = useState(visit2Fields.time);
  const [councilDemoDate, setCouncilDemoDate] = useState(councilDemoFields.date);
  const [councilDemoTime, setCouncilDemoTime] = useState(councilDemoFields.time);
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
    const nextVisit1 = fromScheduleIso(detail.outreach.visit_1_at);
    setVisit1Date(nextVisit1.date);
    setVisit1Time(nextVisit1.time);
    const nextVisit2 = fromScheduleIso(detail.outreach.visit_2_at);
    setVisit2Date(nextVisit2.date);
    setVisit2Time(nextVisit2.time);
    const nextCouncilDemo = fromScheduleIso(detail.outreach.council_demo_at);
    setCouncilDemoDate(nextCouncilDemo.date);
    setCouncilDemoTime(nextCouncilDemo.time);
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
    if (scheduleHasChanged(visit1Date, visit1Time, outreach.visit_1_at)) {
      return true;
    }
    if (scheduleHasChanged(visit2Date, visit2Time, outreach.visit_2_at)) {
      return true;
    }
    if (
      scheduleHasChanged(councilDemoDate, councilDemoTime, outreach.council_demo_at)
    ) {
      return true;
    }
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
    visit1Date,
    visit1Time,
    visit2Date,
    visit2Time,
    councilDemoDate,
    councilDemoTime,
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
        visit_1_at: toScheduleIso(visit1Date, visit1Time),
        visit_2_at: toScheduleIso(visit2Date, visit2Time),
        council_demo_at: toScheduleIso(councilDemoDate, councilDemoTime),
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

      <div className="space-y-3">
        <ScheduleFieldRow
          label="Visite 1"
          date={visit1Date}
          time={visit1Time}
          onDateChange={setVisit1Date}
          onTimeChange={setVisit1Time}
          dateAriaLabel="Date de la visite 1"
          timeAriaLabel="Heure de la visite 1"
        />
        <ScheduleFieldRow
          label="Visite 2"
          date={visit2Date}
          time={visit2Time}
          onDateChange={setVisit2Date}
          onTimeChange={setVisit2Time}
          dateAriaLabel="Date de la visite 2"
          timeAriaLabel="Heure de la visite 2"
        />
        <ScheduleFieldRow
          label="Conseil municipal"
          date={councilDemoDate}
          time={councilDemoTime}
          onDateChange={setCouncilDemoDate}
          onTimeChange={setCouncilDemoTime}
          dateAriaLabel="Date du conseil municipal"
          timeAriaLabel="Heure du conseil municipal"
        />
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
