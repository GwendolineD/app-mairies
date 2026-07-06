import { format, isSameDay } from "date-fns";

import { APP_LOCALE, DAY_MS, parisTz } from "./constants";
import { isSameParisDay } from "./business";
import { parseForFormat, parseInstant } from "./parse";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatParis(date: Date, pattern: string): string {
  return format(date, pattern, { in: parisTz, locale: APP_LOCALE });
}

function formatEventTimeCompact(date: Date): string {
  const hours = Number(formatParis(date, "H"));
  const minutes = Number(formatParis(date, "m"));
  if (minutes === 0) return `${hours}h`;
  return `${hours}h${minutes.toString().padStart(2, "0")}`;
}

function formatEventDayShort(date: Date): string {
  return formatParis(date, "d MMMM yyyy");
}

function formatEventDayFull(date: Date): string {
  return capitalize(formatParis(date, "EEEE d MMMM yyyy"));
}

export type EventRangePart = {
  text: string;
  variant: "connector" | "value";
};

export function getEventRangeParts(start: string, end: string): EventRangePart[] {
  try {
    const startDate = parseForFormat(start);
    const endDate = parseForFormat(end);
    if (isSameDay(startDate, endDate, { in: parisTz })) {
      return [
        { text: "le ", variant: "connector" },
        { text: formatEventDayShort(startDate), variant: "value" },
        { text: " de ", variant: "connector" },
        { text: formatEventTimeCompact(startDate), variant: "value" },
        { text: " à ", variant: "connector" },
        { text: formatEventTimeCompact(endDate), variant: "value" },
      ];
    }
    return [
      { text: "Du ", variant: "connector" },
      { text: formatEventDayShort(startDate), variant: "value" },
      { text: " ", variant: "connector" },
      { text: formatEventTimeCompact(startDate), variant: "value" },
      { text: " au ", variant: "connector" },
      { text: formatEventDayShort(endDate), variant: "value" },
      { text: " ", variant: "connector" },
      { text: formatEventTimeCompact(endDate), variant: "value" },
    ];
  } catch {
    return [{ text: "Planning à confirmer", variant: "value" }];
  }
}

export function formatEventRange(start: string, end: string): string {
  return getEventRangeParts(start, end)
    .map((part) => part.text)
    .join("");
}

export function getEventDetailParts(start: string, end: string): EventRangePart[] {
  try {
    const startDate = parseForFormat(start);
    const endDate = parseForFormat(end);
    if (isSameDay(startDate, endDate, { in: parisTz })) {
      return [
        { text: formatEventDayFull(startDate), variant: "value" },
        { text: " — de ", variant: "connector" },
        { text: formatEventTimeCompact(startDate), variant: "value" },
        { text: " à ", variant: "connector" },
        { text: formatEventTimeCompact(endDate), variant: "value" },
      ];
    }
    return [
      { text: "Du ", variant: "connector" },
      { text: formatEventDayFull(startDate), variant: "value" },
      { text: " à ", variant: "connector" },
      { text: formatEventTimeCompact(startDate), variant: "value" },
      { text: " au ", variant: "connector" },
      { text: formatEventDayFull(endDate), variant: "value" },
      { text: " à ", variant: "connector" },
      { text: formatEventTimeCompact(endDate), variant: "value" },
    ];
  } catch {
    return [{ text: "Planning à confirmer", variant: "value" }];
  }
}

export function formatEventDetail(start: string, end: string): string {
  return getEventDetailParts(start, end)
    .map((part) => part.text)
    .join("");
}

/** "Samedi 15 juin 2025" */
export function formatLongDateFr(value: string): string | null {
  try {
    return capitalize(formatParis(parseForFormat(value), "EEEE d MMMM yyyy"));
  } catch {
    return null;
  }
}

/** dateStyle medium — e.g. "3 juil. 2026" (SSR fallback for RelativeTime). */
export function formatMediumDate(iso: string): string {
  try {
    return formatParis(parseForFormat(iso), "d MMM yyyy");
  } catch {
    return "";
  }
}

/** Short day date, e.g. "8 juin 2026". Returns "—" on invalid input. */
export function formatDay(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return formatParis(parseForFormat(value), "d MMM yyyy");
  } catch {
    return "—";
  }
}

/** Table/backoffice short date — e.g. "03 juil. 2026". */
export function formatShortDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return formatParis(parseForFormat(value), "dd MMM yyyy");
  } catch {
    return "—";
  }
}

/** Short date with time, e.g. "03 juil. 2026 · 14h30". */
export function formatShortDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    const date = parseForFormat(value);
    const datePart = formatShortDate(value);
    const hours = Number(formatParis(date, "H"));
    const minutes = formatParis(date, "m").padStart(2, "0");
    return `${datePart} · ${hours}h${minutes}`;
  } catch {
    return "—";
  }
}

/** Short date with 2-digit year, e.g. "25 juin 26". */
export function formatCompactShortDate(
  value: string | null | undefined,
): string {
  if (!value) return "—";
  try {
    return formatParis(parseForFormat(value), "dd MMM yy");
  } catch {
    return "—";
  }
}

/** Compact month label for chart axes, e.g. "juin 26". */
export function formatMonthShort(value: string): string {
  try {
    const date = parseForFormat(value);
    const month = formatParis(date, "MMM");
    const year = formatParis(date, "yy");
    return `${month} ${year}`;
  } catch {
    return "";
  }
}

/** Month + year label, eg "juin 2026" — used for "Membre depuis". */
export function formatMonthYear(iso: string): string {
  try {
    return formatParis(parseForFormat(iso), "MMMM yyyy");
  } catch {
    return "";
  }
}

/** "9h00" */
export function formatTimeFr(value: string): string | null {
  try {
    const date = parseForFormat(value);
    const hours = Number(formatParis(date, "H"));
    const minutes = formatParis(date, "m").padStart(2, "0");
    return `${hours}h${minutes}`;
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

export function formatLinkedEventDateTime(
  start: string,
  end?: string | null,
): string {
  try {
    if (end) {
      return capitalize(formatEventRange(start, end));
    }
    return capitalize(
      formatParis(parseForFormat(start), "d MMMM yyyy HH:mm"),
    );
  } catch {
    return "";
  }
}

export function formatRelativeTime(iso: string): string {
  try {
    const date = parseForFormat(iso);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "à l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `il y a ${diffH} h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `il y a ${diffD} j`;
    return formatParis(date, "d MMM yyyy");
  } catch {
    return "";
  }
}

/** Compact timestamp for inbox rows (time today, "Hier", weekday, then date). */
export function formatConversationTimestamp(value: string): string {
  try {
    const date = parseForFormat(value);
    const now = new Date();
    if (isSameParisDay(date, now)) {
      return formatParis(date, "HH:mm");
    }
    const yesterday = new Date(now.getTime() - DAY_MS);
    if (isSameParisDay(date, yesterday)) return "Hier";
    if (now.getTime() - date.getTime() < 7 * DAY_MS) {
      return formatParis(date, "EEEE");
    }
    return formatParis(date, "dd/MM");
  } catch {
    return "";
  }
}

/** Time-only label shown under each chat bubble. */
export function formatMessageTime(value: string): string {
  try {
    return formatParis(parseForFormat(value), "HH:mm");
  } catch {
    return "";
  }
}

/** Human day separator inserted between message groups. */
export function formatMessageDaySeparator(value: string): string {
  try {
    const date = parseForFormat(value);
    const now = new Date();
    if (isSameParisDay(date, now)) return "Aujourd'hui";
    const yesterday = new Date(now.getTime() - DAY_MS);
    if (isSameParisDay(date, yesterday)) return "Hier";
    return formatParis(date, "EEEE d MMMM");
  } catch {
    return "";
  }
}

export function formatRelativeTimeAccueil(iso: string): string {
  const relative = formatRelativeTime(iso);
  if (!relative) return relative;
  return relative.charAt(0).toUpperCase() + relative.slice(1);
}

export function formatEventAccueilDate(iso: string): {
  day: number;
  month: string;
} {
  const date = parseForFormat(iso);
  const month = formatParis(date, "MMM").replace(".", "").toUpperCase();
  const day = Number(formatParis(date, "d"));
  return { day, month };
}

export function formatMemberSince(iso: string): string {
  try {
    const date = parseForFormat(iso);
    const dayMonthYear = formatParis(date, "d MMMM yyyy");
    return `Membre depuis le ${dayMonthYear}`;
  } catch {
    return "Membre";
  }
}

export function formatEventAccueilSchedule(
  start: string,
  end?: string | null,
): string {
  try {
    const startDate = parseForFormat(start);
    if (end) {
      const endDate = parseForFormat(end);
      if (!isSameDay(startDate, endDate, { in: parisTz })) {
        const startWeekday = formatParis(startDate, "EEE");
        const endWeekday = formatParis(endDate, "EEE");
        const startDayMonth = formatParis(startDate, "d MMMM");
        const endDayMonth = formatParis(endDate, "d MMMM");
        return `Du ${startWeekday} ${startDayMonth} au ${endWeekday} ${endDayMonth}`;
      }
    }

    const weekday = formatParis(startDate, "EEEE");
    const dayMonth = formatParis(startDate, "d MMMM");
    const time = formatEventTimeCompact(startDate);
    const capitalizedWeekday =
      weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capitalizedWeekday} ${dayMonth} à ${time}`;
  } catch {
    return "Date à confirmer";
  }
}

/** Chat thread date key — e.g. "03/07/2026". */
export function formatChatDateKey(iso: string): string {
  try {
    return formatParis(parseForFormat(iso), "dd/MM/yyyy");
  } catch {
    return "";
  }
}

/** Chat day separator label — "Aujourd'hui", "Hier", or long date. */
export function formatChatDayLabel(iso: string): string {
  try {
    const date = parseForFormat(iso);
    const now = new Date();
    if (isSameParisDay(date, now)) return "Aujourd'hui";
    const yesterday = new Date(now.getTime() - DAY_MS);
    if (isSameParisDay(date, yesterday)) return "Hier";
    return formatParis(date, "d MMMM yyyy");
  } catch {
    return "";
  }
}

/** Chat bubble time — e.g. "16:30". */
export function formatChatTime(iso: string): string {
  try {
    return formatParis(parseForFormat(iso), "HH:mm");
  } catch {
    return "";
  }
}

/** Initiative detail datetime — matches legacy toLocaleString("fr-FR"). */
export function formatDateTimeFr(value: string): string {
  try {
    return formatParis(parseForFormat(value), "dd/MM/yyyy HH:mm:ss");
  } catch {
    return "";
  }
}

/** Email notification datetime. */
export function formatEmailDateTime(value: string): string {
  try {
    const date = parseForFormat(value);
    const datePart = formatParis(date, "dd MMM yyyy");
    const timePart = formatParis(date, "HH:mm");
    return `${datePart}, ${timePart}`;
  } catch {
    return "";
  }
}

/** Profile "Membre depuis" month/year. */
export function formatProfileMonthYear(value?: string): string {
  if (!value) return "récemment";
  try {
    return formatParis(parseForFormat(value), "MMMM yyyy");
  } catch {
    return "récemment";
  }
}

/** Calendar picker display label — e.g. "3 juil. 2026". */
export function formatPickerDateLabel(ymd: string): string {
  try {
    return formatParis(parseForFormat(ymd), "d MMM yyyy");
  } catch {
    return "";
  }
}

/** Split an ISO instant into Paris civil date and time for form fields. */
export function splitInstantToParisFields(isoString: string): {
  date: string;
  time: string;
} {
  try {
    const instant = parseInstant(isoString);
    if (Number.isNaN(instant.getTime())) return { date: "", time: "" };
    return {
      date: formatParis(instant, "yyyy-MM-dd"),
      time: formatParis(instant, "HH:mm"),
    };
  } catch {
    return { date: "", time: "" };
  }
}

/** Format a Date as yyyy-MM-dd in Paris (for picker onChange). */
export function formatParisYmdFromDate(date: Date): string {
  return format(date, "yyyy-MM-dd", { in: parisTz });
}
