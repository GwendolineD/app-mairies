"use client";

import { useState } from "react";

import { DatePickerField } from "@/components/ui/date-picker-field";
import { FormField } from "@/components/ui/form-field";
import { TimePickerField } from "@/components/ui/time-picker-field";
import {
  clampEndDate,
  resolveEndDateAfterStartChange,
  toUtcFromParisLocal,
} from "@/lib/datetime";

export function InitiativeEventScheduleFields() {
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  const eventStartsAt = toUtcFromParisLocal(startDate, startTime) ?? "";
  const eventEndsAt = toUtcFromParisLocal(endDate, endTime) ?? "";

  function handleStartDateChange(nextStartDate: string) {
    setStartDate(nextStartDate);
    setEndDate((prev) => resolveEndDateAfterStartChange(nextStartDate, prev));
  }

  function handleEndDateChange(nextEndDate: string) {
    setEndDate(clampEndDate(nextEndDate, startDate));
  }

  return (
    <>
      <input type="hidden" name="eventStartsAt" value={eventStartsAt} />
      <input type="hidden" name="eventEndsAt" value={eventEndsAt} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Date de début" className="text-xs">
          <DatePickerField
            value={startDate}
            onChange={handleStartDateChange}
            placeholder="Choisir une date"
            className="w-full px-3 py-2 text-xs"
          />
        </FormField>
        <FormField label="Heure de début" className="text-xs">
          <TimePickerField
            value={startTime}
            onChange={setStartTime}
            placeholder="Début"
            className="w-full px-3 py-2 text-xs"
          />
        </FormField>
        <FormField label="Date de fin" className="text-xs">
          <DatePickerField
            value={endDate}
            onChange={handleEndDateChange}
            minDate={startDate || undefined}
            placeholder="Choisir une date"
            className="w-full px-3 py-2 text-xs"
          />
        </FormField>
        <FormField label="Heure de fin" className="text-xs">
          <TimePickerField
            value={endTime}
            onChange={setEndTime}
            placeholder="Fin"
            className="w-full px-3 py-2 text-xs"
          />
        </FormField>
      </div>
    </>
  );
}
