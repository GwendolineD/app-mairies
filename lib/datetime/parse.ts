import { parseISO, isValid } from "date-fns";
import { TZDate } from "@date-fns/tz";

import { APP_TIMEZONE } from "./constants";

/** Parse an ISO timestamp (timestamptz) to a UTC Date. */
export function parseInstant(iso: string): Date {
  return parseISO(iso);
}

/**
 * Parse a civil date-only string (YYYY-MM-DD).
 * Matches legacy `new Date(ymd)` semantics (UTC midnight) for display parity.
 */
export function parseDateOnly(ymd: string): Date {
  const parsed = parseISO(ymd);
  if (isValid(parsed)) return parsed;
  return new Date(ymd);
}

function parseInput(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return parseDateOnly(value);
  }
  return parseInstant(value);
}

/** Internal: parse ISO or date-only string for formatting. */
export function parseForFormat(value: string): Date {
  return parseInput(value);
}

/** Convert Paris local date (yyyy-MM-dd) + time (HH:mm) to ISO UTC string. */
export function toUtcFromParisLocal(date: string, time: string): string | null {
  if (!date || !time) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  if ([year, month, day, hours, minutes].some((value) => Number.isNaN(value))) {
    return null;
  }
  const paris = new TZDate(
    year,
    month - 1,
    day,
    hours,
    minutes,
    0,
    APP_TIMEZONE,
  );
  return new Date(paris.getTime()).toISOString();
}

/** @deprecated Use toUtcFromParisLocal */
export const localDateTimeToIso = toUtcFromParisLocal;
