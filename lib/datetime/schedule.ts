import {
  formatShortDate,
  formatShortDateTime,
  splitInstantToParisFields,
} from "./format";
import { toUtcFromParisLocal } from "./parse";

/** Paris date + optional time (HH:mm) to ISO UTC. Empty time => midnight Paris. */
export function toScheduleIso(date: string, time: string): string | null {
  if (!date) return null;
  return toUtcFromParisLocal(date, time || "00:00");
}

/** ISO instant to Paris date + time form fields. Midnight => empty time (optional hour). */
export function fromScheduleIso(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const { date, time } = splitInstantToParisFields(iso);
  return { date, time: time === "00:00" ? "" : time };
}

/** Compare schedule form state to stored ISO (ms precision, not string equality). */
export function scheduleHasChanged(
  date: string,
  time: string,
  storedIso: string | null,
): boolean {
  const nextIso = toScheduleIso(date, time);
  if (!nextIso && !storedIso) return false;
  if (!nextIso || !storedIso) return true;

  const nextMs = Date.parse(nextIso);
  const storedMs = Date.parse(storedIso);
  if (Number.isNaN(nextMs) || Number.isNaN(storedMs)) {
    return nextIso !== storedIso;
  }
  return nextMs !== storedMs;
}

/** Display prospect visit/council datetime: date only if hour unset (00:00 Paris). */
export function formatProspectScheduledAt(
  value: string | null | undefined,
): string {
  if (!value) return "—";
  try {
    const { time } = splitInstantToParisFields(value);
    if (time === "00:00") return formatShortDate(value);
    return formatShortDateTime(value);
  } catch {
    return "—";
  }
}
