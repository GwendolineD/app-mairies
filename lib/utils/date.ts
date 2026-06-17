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

export function formatShortDate(iso: string): string {
  try {
    return formatFr(new Date(iso), { dateStyle: "medium" });
  } catch {
    return "";
  }
}

const PARIS_TZ = "Europe/Paris";

const WEEKDAY_DATE: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: PARIS_TZ,
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** "Samedi 15 juin 2025" */
export function formatLongDateFr(value: string): string | null {
  try {
    return capitalize(formatFr(new Date(value), WEEKDAY_DATE));
  } catch {
    return null;
  }
}

/** "9h00" */
export function formatTimeFr(value: string): string | null {
  try {
    const parts = new Intl.DateTimeFormat("fr-FR", {
      hour: "numeric",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: PARIS_TZ,
    }).formatToParts(new Date(value));
    const hour = parts.find((p) => p.type === "hour")?.value ?? "";
    const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
    if (!hour) return null;
    return `${parseInt(hour, 10)}h${minute}`;
  } catch {
    return null;
  }
}

/** Short, human temporality label for an initiative card. */
export function formatInitiativeWhen(
  dateMode: string,
  startsAt: string | null,
): string {
  if (dateMode === "once" && startsAt) {
    return formatLongDateFr(startsAt) ?? "Date à confirmer";
  }
  if (dateMode === "recurring") return "Rendez-vous récurrent";
  return "À tout moment";
}

const RELATIVE_DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

/** Compact relative time, eg "il y a 3 h" / "il y a 2 j". */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  try {
    const formatter = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });
    let duration = (new Date(iso).getTime() - now.getTime()) / 1000;
    for (const division of RELATIVE_DIVISIONS) {
      if (Math.abs(duration) < division.amount) {
        return formatter.format(Math.round(duration), division.unit);
      }
      duration /= division.amount;
    }
    return formatter.format(Math.round(duration), "year");
  } catch {
    return "récemment";
  }
}

/** Month + year label, eg "juin 2026" — used for "Membre depuis". */
export function formatMonthYear(iso: string): string {
  try {
    return formatFr(new Date(iso), { month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Compact timestamp for inbox rows (time today, "Hier", weekday, then date). */
export function formatConversationTimestamp(value: string): string {
  try {
    const date = new Date(value);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return formatFr(date, TIME_SHORT);
    }
    const yesterday = new Date(now.getTime() - DAY_MS);
    if (date.toDateString() === yesterday.toDateString()) return "Hier";
    if (now.getTime() - date.getTime() < 7 * DAY_MS) {
      return new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(date);
    }
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    }).format(date);
  } catch {
    return "";
  }
}

/** Time-only label shown under each chat bubble. */
export function formatMessageTime(value: string): string {
  try {
    return formatFr(new Date(value), TIME_SHORT);
  } catch {
    return "";
  }
}

/** Human day separator inserted between message groups. */
export function formatMessageDaySeparator(value: string): string {
  try {
    const date = new Date(value);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return "Aujourd'hui";
    const yesterday = new Date(now.getTime() - DAY_MS);
    if (date.toDateString() === yesterday.toDateString()) return "Hier";
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date);
  } catch {
    return "";
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

export function formatRelativeTimeAccueil(iso: string): string {
  const relative = formatRelativeTime(iso);
  if (!relative) return relative;
  return relative.charAt(0).toUpperCase() + relative.slice(1);
}

export function formatEventAccueilDate(iso: string): { day: number; month: string } {
  const date = new Date(iso);
  const month = new Intl.DateTimeFormat("fr-FR", { month: "short" })
    .format(date)
    .replace(".", "")
    .toUpperCase();
  return { day: date.getDate(), month };
}

export function formatMemberSince(iso: string): string {
  try {
    const date = new Date(iso);
    const month = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(date);
    return `Membre depuis ${month} ${date.getFullYear()}`;
  } catch {
    return "Membre";
  }
}

export function formatEventAccueilSchedule(iso: string): string {
  try {
    const date = new Date(iso);
    const weekday = new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(date);
    const dayMonth = new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
    }).format(date);
    const time = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" }).format(date);
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capitalizedWeekday} ${dayMonth} à ${time}`;
  } catch {
    return "Date à confirmer";
  }
}
