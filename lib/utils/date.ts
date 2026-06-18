const TIME_SHORT: Intl.DateTimeFormatOptions = {
  timeStyle: "short",
};

const DATE_DAY: Intl.DateTimeFormatOptions = { dateStyle: "medium" };

const WEEKDAY_DATE: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Convert local date (yyyy-MM-dd) + time (HH:mm) to ISO UTC string. */
export function localDateTimeToIso(date: string, time: string): string | null {
  if (!date || !time) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  if ([year, month, day, hours, minutes].some((value) => Number.isNaN(value))) {
    return null;
  }
  return new Date(year, month - 1, day, hours, minutes, 0).toISOString();
}

function formatFr(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("fr-FR", options).format(date);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isSameCalendarDay(start: Date, end: Date): boolean {
  return start.toDateString() === end.toDateString();
}

function formatEventDayShort(date: Date): string {
  return formatFr(date, { day: "numeric", month: "long", year: "numeric" });
}

export type EventRangePart = {
  text: string;
  variant: "connector" | "value";
};

export function getEventRangeParts(start: string, end: string): EventRangePart[] {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isSameCalendarDay(startDate, endDate)) {
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

function formatEventDayFull(date: Date): string {
  return capitalize(
    formatFr(date, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  );
}

function formatEventTimeCompact(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  if (minutes === 0) return `${hours}h`;
  return `${hours}h${minutes.toString().padStart(2, "0")}`;
}

export function formatEventDetail(start: string, end: string): string {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isSameCalendarDay(startDate, endDate)) {
      return `${formatEventDayFull(startDate)} — de ${formatEventTimeCompact(startDate)} à ${formatEventTimeCompact(endDate)}`;
    }
    return `Du ${formatEventDayFull(startDate)} à ${formatEventTimeCompact(startDate)} au ${formatEventDayFull(endDate)} à ${formatEventTimeCompact(endDate)}`;
  } catch {
    return "Planning à confirmer";
  }
}

/** "Samedi 15 juin 2025" */
export function formatLongDateFr(value: string): string | null {
  try {
    return capitalize(formatFr(new Date(value), WEEKDAY_DATE));
  } catch {
    return null;
  }
}

export function formatShortDate(iso: string): string {
  try {
    return formatFr(new Date(iso), { dateStyle: "medium" });
  } catch {
    return "";
  }
}

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
    const date = new Date(value);
    const month = new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(date);
    const year = String(date.getFullYear()).slice(-2);
    return `${month} ${year}`;
  } catch {
    return "";
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

/** "9h00" */
export function formatTimeFr(value: string): string | null {
  try {
    const date = new Date(value);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
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

export function formatLinkedEventDateTime(start: string, end?: string | null): string {
  try {
    if (end) {
      return capitalize(formatEventRange(start, end));
    }
    return capitalize(
      formatFr(new Date(start), {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
  } catch {
    return "";
  }
}

export function formatRelativeTime(iso: string): string {
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "à l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `il y a ${diffH} h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `il y a ${diffD} j`;
    return formatFr(date, { dateStyle: "medium" });
  } catch {
    return "";
  }
}

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

export function formatEventAccueilSchedule(start: string, end?: string | null): string {
  try {
    const startDate = new Date(start);
    if (end) {
      const endDate = new Date(end);
      if (!isSameCalendarDay(startDate, endDate)) {
        const startWeekday = new Intl.DateTimeFormat("fr-FR", {
          weekday: "short",
        }).format(startDate);
        const endWeekday = new Intl.DateTimeFormat("fr-FR", {
          weekday: "short",
        }).format(endDate);
        const startDayMonth = new Intl.DateTimeFormat("fr-FR", {
          day: "numeric",
          month: "long",
        }).format(startDate);
        const endDayMonth = new Intl.DateTimeFormat("fr-FR", {
          day: "numeric",
          month: "long",
        }).format(endDate);
        return `Du ${startWeekday} ${startDayMonth} au ${endWeekday} ${endDayMonth}`;
      }
    }

    const weekday = new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(startDate);
    const dayMonth = new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
    }).format(startDate);
    const time = formatEventTimeCompact(startDate);
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capitalizedWeekday} ${dayMonth} à ${time}`;
  } catch {
    return "Date à confirmer";
  }
}
