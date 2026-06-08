const DATE_TIME_SHORT: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

const DATE_FULL: Intl.DateTimeFormatOptions = {
  dateStyle: "full",
  timeStyle: "short",
};

const TIME_SHORT: Intl.DateTimeFormatOptions = {
  timeStyle: "short",
};

function formatFr(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("fr-FR", options).format(date);
}

export function formatEventRange(start: string, end: string): string {
  try {
    return `${formatFr(new Date(start), DATE_TIME_SHORT)} → ${formatFr(new Date(end), DATE_TIME_SHORT)}`;
  } catch {
    return "Planning à confirmer";
  }
}

export function formatEventDetail(start: string, end: string): string {
  try {
    return `${formatFr(new Date(start), DATE_FULL)} — ${formatFr(new Date(end), TIME_SHORT)}`;
  } catch {
    return "Planning à confirmer";
  }
}

const DATE_DAY: Intl.DateTimeFormatOptions = { dateStyle: "medium" };
const MONTH_SHORT: Intl.DateTimeFormatOptions = {
  month: "short",
  year: "2-digit",
};

/** Short day date, e.g. "8 juin 2026". Returns "—" on invalid input. */
export function formatDay(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return formatFr(new Date(value), DATE_DAY);
  } catch {
    return "—";
  }
}

/** Compact month label for chart axes, e.g. "juin 26". */
export function formatMonthShort(value: string): string {
  try {
    return formatFr(new Date(value), MONTH_SHORT).replace(".", "");
  } catch {
    return value;
  }
}
