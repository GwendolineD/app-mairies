import { addDays, addWeeks, format, isBefore, startOfDay, startOfWeek } from "date-fns";

import { parisTz } from "./constants";
import { parseDateOnly, toUtcFromParisLocal } from "./parse";

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Current instant as a Date (UTC). */
export function nowUtc(): Date {
  return new Date();
}

/** Start of the Paris civil day for `from`, as UTC ISO (for DB range filters). */
export function startOfTodayParisIso(from: Date = new Date()): string {
  return startOfDay(from, { in: parisTz }).toISOString();
}

/** Civil today in Paris as YYYY-MM-DD. */
export function todayParisYmd(from: Date = new Date()): string {
  return toParisYmd(from);
}

/** Format a Date as YYYY-MM-DD in Paris civil calendar. */
export function toParisYmd(date: Date): string {
  return format(date, "yyyy-MM-dd", { in: parisTz });
}

/** Add calendar days in Paris and return YYYY-MM-DD. */
export function addDaysParisYmd(days: number, from: Date = new Date()): string {
  return format(addDays(from, days, { in: parisTz }), "yyyy-MM-dd", {
    in: parisTz,
  });
}

/** Paris civil day as UTC ISO bounds [startInclusive, endExclusive) for DB filters. */
export function parisDayUtcBounds(
  ymd: string,
): { start: string; end: string } | null {
  if (!YMD_RE.test(ymd)) return null;

  const start = toUtcFromParisLocal(ymd, "00:00");
  if (!start) return null;

  const nextDay = addDaysParisYmd(1, parseDateOnly(ymd));
  const end = toUtcFromParisLocal(nextDay, "00:00");
  if (!end) return null;

  return { start, end };
}

/** Whether two instants fall on the same Paris civil day. */
export function isSameParisDay(a: Date | string, b: Date | string): boolean {
  const da = typeof a === "string" ? new Date(a) : a;
  const db = typeof b === "string" ? new Date(b) : b;
  return toParisYmd(da) === toParisYmd(db);
}

/** Monday-start week bucket for a timestamp in Paris. */
export function startOfParisWeek(date: Date | string): Date {
  const instant = typeof date === "string" ? new Date(date) : date;
  return startOfWeek(instant, { weekStartsOn: 1, in: parisTz });
}

/** Format a week label for dashboard charts — e.g. "29/06". */
export function formatParisWeekLabel(date: Date): string {
  return format(date, "dd/MM", { in: parisTz });
}

/** Build Monday-start week buckets from `since` through the current Paris week. */
export function buildParisWeekBuckets(since: Date): Date[] {
  const buckets: Date[] = [];
  const now = new Date();
  let cursor = startOfParisWeek(since);
  const currentWeek = startOfParisWeek(now);
  while (
    isBefore(cursor, currentWeek) ||
    cursor.getTime() === currentWeek.getTime()
  ) {
    buckets.push(new Date(cursor));
    cursor = addWeeks(cursor, 1, { in: parisTz });
  }
  return buckets;
}

/** Count rows per Paris week bucket (keyed by bucket timestamp). */
export function countByParisWeek(
  dates: { created_at: string }[],
): Map<number, number> {
  const map = new Map<number, number>();
  for (const { created_at } of dates) {
    const week = startOfParisWeek(new Date(created_at));
    const ts = week.getTime();
    map.set(ts, (map.get(ts) ?? 0) + 1);
  }
  return map;
}

function isYmdBefore(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a < b;
}

/** Keep end date on or after start when start changes (yyyy-MM-dd strings). */
export function resolveEndDateAfterStartChange(
  startDate: string,
  endDate: string,
): string {
  if (!startDate) return endDate;
  if (!endDate || isYmdBefore(endDate, startDate)) return startDate;
  return endDate;
}

/** Clamp end date so it is not before start (yyyy-MM-dd strings). */
export function clampEndDate(endDate: string, startDate: string): string {
  if (!startDate) return endDate;
  if (!endDate || isYmdBefore(endDate, startDate)) return startDate;
  return endDate;
}
