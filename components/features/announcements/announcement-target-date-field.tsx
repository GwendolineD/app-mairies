"use client";

import { useState } from "react";

import { DatePickerField } from "@/components/ui/date-picker-field";

type Props = {
  name?: string;
};

export function AnnouncementTargetDateField({ name = "targetDate" }: Props) {
  const [targetDate, setTargetDate] = useState("");

  return (
    <>
      <input type="hidden" name={name} value={targetDate} />
      <DatePickerField
        value={targetDate}
        onChange={setTargetDate}
        placeholder="Choisir une date"
        className="w-full"
      />
    </>
  );
}
